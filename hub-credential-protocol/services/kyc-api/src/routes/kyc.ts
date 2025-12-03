import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { kycSessionService } from '../services/kycSessionService.js';
import { validateBody } from '../middleware/validation.js';
import { KycVerificationRequestSchema, CredentialTypeSchema } from '../types/credential.js';

const router = Router();

// Schema for creating a session
const CreateSessionSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  credentialType: CredentialTypeSchema,
});

// POST /api/kyc/session - Create a new KYC session
router.post('/session', validateBody(CreateSessionSchema), async (req: Request, res: Response) => {
  try {
    const { walletAddress, credentialType } = req.body;
    const session = kycSessionService.createSession(walletAddress, credentialType);
    return res.status(201).json(session);
  } catch (error: any) {
    console.error('Create session error:', error);
    return res.status(500).json({ error: 'Failed to create KYC session' });
  }
});

// GET /api/kyc/session/:sessionId - Get session status
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = kycSessionService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    return res.json({
      sessionId: session.sessionId,
      status: session.status,
      walletAddress: session.walletAddress,
      credentialType: session.credentialType,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      verificationResult: session.verificationResult,
    });
  } catch (error: any) {
    console.error('Get session error:', error);
    return res.status(500).json({ error: 'Failed to get session' });
  }
});

// PUT /api/kyc/session/:sessionId - Update session data
router.put('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const data = req.body;

    // Validate KYC data
    const validationResult = KycVerificationRequestSchema.partial().safeParse(data);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationResult.error.errors,
      });
    }

    const session = kycSessionService.updateSessionData(sessionId, validationResult.data);

    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    return res.json({
      sessionId: session.sessionId,
      status: session.status,
      walletAddress: session.walletAddress,
      credentialType: session.credentialType,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    });
  } catch (error: any) {
    console.error('Update session error:', error);
    return res.status(500).json({ error: 'Failed to update session' });
  }
});

// POST /api/kyc/session/:sessionId/submit - Submit for verification
router.post('/session/:sessionId/submit', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await kycSessionService.processVerification(sessionId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const session = result.session!;
    return res.json({
      sessionId: session.sessionId,
      status: session.status,
      walletAddress: session.walletAddress,
      credentialType: session.credentialType,
      verificationResult: session.verificationResult,
    });
  } catch (error: any) {
    console.error('Submit verification error:', error);
    return res.status(500).json({ error: 'Failed to process verification' });
  }
});

// DELETE /api/kyc/session/:sessionId - Cancel session
router.delete('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const deleted = kycSessionService.deleteSession(sessionId);

    if (!deleted) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json({ success: true, message: 'Session cancelled' });
  } catch (error: any) {
    console.error('Delete session error:', error);
    return res.status(500).json({ error: 'Failed to cancel session' });
  }
});

export default router;
