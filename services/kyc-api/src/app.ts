import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import routes from './routes/index.js';
import { kycSessionService } from './services/kycSessionService.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (config.cors.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow localhost
      if (config.nodeEnv === 'development' && origin.startsWith('http://localhost')) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    network: config.solana.network,
    programId: config.program.credentialProgramId.toString(),
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }

  return res.status(500).json({ error: 'Internal server error' });
});

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  const cleaned = kycSessionService.cleanupExpiredSessions();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired KYC sessions`);
  }
}, 5 * 60 * 1000);

// Start server
app.listen(config.port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                Hub Credential Protocol API                  ║
╠════════════════════════════════════════════════════════════╣
║  Server running on port: ${config.port.toString().padEnd(33)}║
║  Environment: ${config.nodeEnv.padEnd(44)}║
║  Solana Network: ${config.solana.network.padEnd(41)}║
║  Program ID: ${config.program.credentialProgramId.toString().slice(0, 20)}...              ║
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

Admin Endpoints:
  GET  /api/admin/config          - Get admin configuration
  GET  /api/admin/verify/:wallet  - Check if wallet is admin
  GET  /api/admin/properties      - Get all properties
  GET  /api/admin/properties/:mint - Get property details
  POST /api/admin/properties      - Create new property
  POST /api/admin/properties/:mint/toggle - Toggle property status
  POST /api/admin/mint            - Mint tokens to investor
  POST /api/admin/revenue         - Deposit revenue
  `);
});

export default app;
