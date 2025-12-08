import { Router, Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { z } from 'zod';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';

const router = Router();

// In-memory nonce store (use Redis in production)
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

// Nonce expiration time (5 minutes)
const NONCE_TTL = 5 * 60 * 1000;

// Schema for requesting a nonce
const RequestNonceSchema = z.object({
  walletAddress: z.string().min(32).max(44),
});

// Schema for verifying signature
const VerifySignatureSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  signature: z.string(),
  nonce: z.string(),
});

// POST /api/auth/nonce - Request a nonce for wallet authentication
router.post('/nonce', validateBody(RequestNonceSchema), async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    // Validate wallet address
    try {
      new PublicKey(walletAddress);
    } catch {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // Generate nonce
    const nonce = `Sign this message to authenticate with Hub Credential Protocol.\n\nNonce: ${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = Date.now() + NONCE_TTL;

    nonceStore.set(walletAddress, { nonce, expiresAt });

    return res.json({ nonce, expiresAt });
  } catch (error: any) {
    console.error('Request nonce error:', error);
    return res.status(500).json({ error: 'Failed to generate nonce' });
  }
});

// POST /api/auth/verify - Verify wallet signature and return JWT
router.post('/verify', validateBody(VerifySignatureSchema), async (req: Request, res: Response) => {
  try {
    const { walletAddress, signature, nonce } = req.body;

    // Validate wallet address
    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(walletAddress);
    } catch {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // Check nonce
    const storedNonce = nonceStore.get(walletAddress);
    if (!storedNonce) {
      return res.status(400).json({ error: 'No pending nonce. Request a new nonce first.' });
    }

    if (storedNonce.nonce !== nonce) {
      return res.status(400).json({ error: 'Invalid nonce' });
    }

    if (Date.now() > storedNonce.expiresAt) {
      nonceStore.delete(walletAddress);
      return res.status(400).json({ error: 'Nonce expired. Request a new nonce.' });
    }

    // Verify signature
    try {
      const signatureBytes = bs58.decode(signature);
      const messageBytes = new TextEncoder().encode(nonce);
      const publicKeyBytes = publicKey.toBytes();

      const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } catch (err) {
      return res.status(400).json({ error: 'Failed to verify signature' });
    }

    // Clear used nonce
    nonceStore.delete(walletAddress);

    // Generate JWT
    // In production, check if wallet is admin from database
    const isAdmin = false; // You would check this against your admin list
    const token = generateToken(walletAddress, isAdmin);

    return res.json({
      token,
      walletAddress,
      isAdmin,
    });
  } catch (error: any) {
    console.error('Verify signature error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    return res.json({
      walletAddress: req.user?.walletAddress,
      isAdmin: req.user?.isAdmin,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
