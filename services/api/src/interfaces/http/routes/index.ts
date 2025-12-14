import { Router } from 'express';
import { createPropertyRoutes } from './propertyRoutes';
import { createKycRoutes } from './kycRoutes';
import { createInvestorRoutes } from './investorRoutes';
import { createRevenueRoutes } from './revenueRoutes';
import { createIpfsRoutes } from './ipfsRoutes';
import { createAdminRoutes } from './adminRoutes';
import { createInvestRoutes } from './investRoutes';
import { createUserRoutes } from './userRoutes';
import { createDividendRoutes, createDividendAdminRoutes } from './dividendRoutes';
import { createStatsRoutes } from './statsRoutes';

export function createApiRoutes(): Router {
  const router = Router();

  router.use('/properties', createPropertyRoutes());
  router.use('/kyc', createKycRoutes());
  router.use('/investors', createInvestorRoutes());
  router.use('/revenue', createRevenueRoutes());
  router.use('/ipfs', createIpfsRoutes());
  router.use('/admin', createAdminRoutes());
  router.use('/admin/dividends', createDividendAdminRoutes());
  router.use('/invest', createInvestRoutes());
  router.use('/users', createUserRoutes());
  router.use('/dividends', createDividendRoutes());
  router.use('/stats', createStatsRoutes());

  // Health check
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  return router;
}
