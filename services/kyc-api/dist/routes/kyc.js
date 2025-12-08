"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const kycSessionService_js_1 = require("../services/kycSessionService.js");
const validation_js_1 = require("../middleware/validation.js");
const credential_js_1 = require("../types/credential.js");
const router = (0, express_1.Router)();
// Schema for creating a session
const CreateSessionSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().min(32).max(44),
    credentialType: credential_js_1.CredentialTypeSchema,
});
// POST /api/kyc/session - Create a new KYC session
router.post('/session', (0, validation_js_1.validateBody)(CreateSessionSchema), async (req, res) => {
    try {
        const { walletAddress, credentialType } = req.body;
        const session = kycSessionService_js_1.kycSessionService.createSession(walletAddress, credentialType);
        return res.status(201).json(session);
    }
    catch (error) {
        console.error('Create session error:', error);
        return res.status(500).json({ error: 'Failed to create KYC session' });
    }
});
// GET /api/kyc/session/:sessionId - Get session status
router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = kycSessionService_js_1.kycSessionService.getSession(sessionId);
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
    }
    catch (error) {
        console.error('Get session error:', error);
        return res.status(500).json({ error: 'Failed to get session' });
    }
});
// PUT /api/kyc/session/:sessionId - Update session data
router.put('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const data = req.body;
        // Validate KYC data
        const validationResult = credential_js_1.KycVerificationRequestSchema.partial().safeParse(data);
        if (!validationResult.success) {
            return res.status(400).json({
                error: 'Validation error',
                details: validationResult.error.errors,
            });
        }
        const session = kycSessionService_js_1.kycSessionService.updateSessionData(sessionId, validationResult.data);
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
    }
    catch (error) {
        console.error('Update session error:', error);
        return res.status(500).json({ error: 'Failed to update session' });
    }
});
// POST /api/kyc/session/:sessionId/submit - Submit for verification
router.post('/session/:sessionId/submit', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const result = await kycSessionService_js_1.kycSessionService.processVerification(sessionId);
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        const session = result.session;
        return res.json({
            sessionId: session.sessionId,
            status: session.status,
            walletAddress: session.walletAddress,
            credentialType: session.credentialType,
            verificationResult: session.verificationResult,
        });
    }
    catch (error) {
        console.error('Submit verification error:', error);
        return res.status(500).json({ error: 'Failed to process verification' });
    }
});
// DELETE /api/kyc/session/:sessionId - Cancel session
router.delete('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const deleted = kycSessionService_js_1.kycSessionService.deleteSession(sessionId);
        if (!deleted) {
            return res.status(404).json({ error: 'Session not found' });
        }
        return res.json({ success: true, message: 'Session cancelled' });
    }
    catch (error) {
        console.error('Delete session error:', error);
        return res.status(500).json({ error: 'Failed to cancel session' });
    }
});
exports.default = router;
//# sourceMappingURL=kyc.js.map