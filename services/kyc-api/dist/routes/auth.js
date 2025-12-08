"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const web3_js_1 = require("@solana/web3.js");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const bs58_1 = __importDefault(require("bs58"));
const zod_1 = require("zod");
const auth_js_1 = require("../middleware/auth.js");
const validation_js_1 = require("../middleware/validation.js");
const router = (0, express_1.Router)();
// In-memory nonce store (use Redis in production)
const nonceStore = new Map();
// Nonce expiration time (5 minutes)
const NONCE_TTL = 5 * 60 * 1000;
// Schema for requesting a nonce
const RequestNonceSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().min(32).max(44),
});
// Schema for verifying signature
const VerifySignatureSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().min(32).max(44),
    signature: zod_1.z.string(),
    nonce: zod_1.z.string(),
});
// POST /api/auth/nonce - Request a nonce for wallet authentication
router.post('/nonce', (0, validation_js_1.validateBody)(RequestNonceSchema), async (req, res) => {
    try {
        const { walletAddress } = req.body;
        // Validate wallet address
        try {
            new web3_js_1.PublicKey(walletAddress);
        }
        catch {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }
        // Generate nonce
        const nonce = `Sign this message to authenticate with Hub Credential Protocol.\n\nNonce: ${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        const expiresAt = Date.now() + NONCE_TTL;
        nonceStore.set(walletAddress, { nonce, expiresAt });
        return res.json({ nonce, expiresAt });
    }
    catch (error) {
        console.error('Request nonce error:', error);
        return res.status(500).json({ error: 'Failed to generate nonce' });
    }
});
// POST /api/auth/verify - Verify wallet signature and return JWT
router.post('/verify', (0, validation_js_1.validateBody)(VerifySignatureSchema), async (req, res) => {
    try {
        const { walletAddress, signature, nonce } = req.body;
        // Validate wallet address
        let publicKey;
        try {
            publicKey = new web3_js_1.PublicKey(walletAddress);
        }
        catch {
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
            const signatureBytes = bs58_1.default.decode(signature);
            const messageBytes = new TextEncoder().encode(nonce);
            const publicKeyBytes = publicKey.toBytes();
            const isValid = tweetnacl_1.default.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }
        catch (err) {
            return res.status(400).json({ error: 'Failed to verify signature' });
        }
        // Clear used nonce
        nonceStore.delete(walletAddress);
        // Generate JWT
        // In production, check if wallet is admin from database
        const isAdmin = false; // You would check this against your admin list
        const token = (0, auth_js_1.generateToken)(walletAddress, isAdmin);
        return res.json({
            token,
            walletAddress,
            isAdmin,
        });
    }
    catch (error) {
        console.error('Verify signature error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
});
// GET /api/auth/me - Get current user info
router.get('/me', auth_js_1.authenticateToken, async (req, res) => {
    try {
        return res.json({
            walletAddress: req.user?.walletAddress,
            isAdmin: req.user?.isAdmin,
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ error: 'Failed to get user info' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map