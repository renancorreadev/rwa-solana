"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const credentialService_js_1 = require("../services/credentialService.js");
const auth_js_1 = require("../middleware/auth.js");
const validation_js_1 = require("../middleware/validation.js");
const credential_js_1 = require("../types/credential.js");
const router = (0, express_1.Router)();
// GET /api/credentials/:walletAddress - Get credential for a wallet
router.get('/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const result = await credentialService_js_1.credentialService.getCredential(walletAddress);
        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }
        return res.json(result);
    }
    catch (error) {
        console.error('Get credential error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/credentials/verify - Verify a credential
router.post('/verify', (0, validation_js_1.validateBody)(credential_js_1.VerifyCredentialSchema), async (req, res) => {
    try {
        const { userWallet, requiredType } = req.body;
        const result = await credentialService_js_1.credentialService.verifyCredential(userWallet, requiredType);
        return res.json(result);
    }
    catch (error) {
        console.error('Verify credential error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/credentials/issue - Issue a new credential (admin only)
router.post('/issue', auth_js_1.authenticateToken, auth_js_1.requireAdmin, (0, validation_js_1.validateBody)(credential_js_1.IssueCredentialSchema), async (req, res) => {
    try {
        const result = await credentialService_js_1.credentialService.issueCredential(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        return res.status(201).json(result);
    }
    catch (error) {
        console.error('Issue credential error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/credentials/refresh - Refresh a credential (admin only)
router.post('/refresh', auth_js_1.authenticateToken, auth_js_1.requireAdmin, (0, validation_js_1.validateBody)(credential_js_1.RefreshCredentialSchema), async (req, res) => {
    try {
        const result = await credentialService_js_1.credentialService.refreshCredential(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        return res.json(result);
    }
    catch (error) {
        console.error('Refresh credential error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/credentials/revoke - Revoke a credential (admin only)
router.post('/revoke', auth_js_1.authenticateToken, auth_js_1.requireAdmin, (0, validation_js_1.validateBody)(credential_js_1.RevokeCredentialSchema), async (req, res) => {
    try {
        const result = await credentialService_js_1.credentialService.revokeCredential(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        return res.json(result);
    }
    catch (error) {
        console.error('Revoke credential error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=credential.js.map