import { Router, Request, Response } from 'express';
import { credentialService } from '../services/credentialService.js';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import {
  IssueCredentialSchema,
  VerifyCredentialSchema,
  RefreshCredentialSchema,
  RevokeCredentialSchema,
} from '../types/credential.js';

const router = Router();

// GET /api/credentials/:walletAddress - Get credential for a wallet
router.get('/:walletAddress', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const result = await credentialService.getCredential(walletAddress);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Get credential error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/credentials/verify - Verify a credential
router.post('/verify', validateBody(VerifyCredentialSchema), async (req: Request, res: Response) => {
  try {
    const { userWallet, requiredType } = req.body;
    const result = await credentialService.verifyCredential(userWallet, requiredType);
    return res.json(result);
  } catch (error: any) {
    console.error('Verify credential error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/credentials/issue - Issue a new credential (admin only)
router.post(
  '/issue',
  authenticateToken,
  requireAdmin,
  validateBody(IssueCredentialSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await credentialService.issueCredential(req.body);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(201).json(result);
    } catch (error: any) {
      console.error('Issue credential error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/credentials/refresh - Refresh a credential (admin only)
router.post(
  '/refresh',
  authenticateToken,
  requireAdmin,
  validateBody(RefreshCredentialSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await credentialService.refreshCredential(req.body);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Refresh credential error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/credentials/revoke - Revoke a credential (admin only)
router.post(
  '/revoke',
  authenticateToken,
  requireAdmin,
  validateBody(RevokeCredentialSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await credentialService.revokeCredential(req.body);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Revoke credential error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
