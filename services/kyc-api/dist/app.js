"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_js_1 = require("./config.js");
const index_js_1 = __importDefault(require("./routes/index.js"));
const kycSessionService_js_1 = require("./services/kycSessionService.js");
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// CORS
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (config_js_1.config.cors.allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // In development, allow localhost
        if (config_js_1.config.nodeEnv === 'development' && origin.startsWith('http://localhost')) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later' },
});
app.use(limiter);
// Body parsing
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        network: config_js_1.config.solana.network,
        programId: config_js_1.config.program.credentialProgramId.toString(),
    });
});
// API routes
app.use('/api', index_js_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'CORS not allowed' });
    }
    return res.status(500).json({ error: 'Internal server error' });
});
// Cleanup expired sessions every 5 minutes
setInterval(() => {
    const cleaned = kycSessionService_js_1.kycSessionService.cleanupExpiredSessions();
    if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired KYC sessions`);
    }
}, 5 * 60 * 1000);
// Start server
app.listen(config_js_1.config.port, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                Hub Credential Protocol API                  ║
╠════════════════════════════════════════════════════════════╣
║  Server running on port: ${config_js_1.config.port.toString().padEnd(33)}║
║  Environment: ${config_js_1.config.nodeEnv.padEnd(44)}║
║  Solana Network: ${config_js_1.config.solana.network.padEnd(41)}║
║  Program ID: ${config_js_1.config.program.credentialProgramId.toString().slice(0, 20)}...              ║
╚════════════════════════════════════════════════════════════╝

Endpoints:
  GET  /health                    - Health check
  POST /api/auth/nonce            - Request authentication nonce
  POST /api/auth/verify           - Verify wallet signature
  GET  /api/auth/me               - Get current user
  GET  /api/credentials/:wallet   - Get credential
  POST /api/credentials/verify    - Verify credential
  POST /api/credentials/issue     - Issue credential (admin)
  POST /api/credentials/refresh   - Refresh credential (admin)
  POST /api/credentials/revoke    - Revoke credential (admin)
  POST /api/kyc/session           - Create KYC session
  GET  /api/kyc/session/:id       - Get session status
  PUT  /api/kyc/session/:id       - Update session data
  POST /api/kyc/session/:id/submit - Submit for verification
  `);
});
exports.default = app;
//# sourceMappingURL=app.js.map