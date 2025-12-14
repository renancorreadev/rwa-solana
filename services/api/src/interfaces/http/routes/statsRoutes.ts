import { Router } from 'express';
import { container } from 'tsyringe';
import { StatsController } from '../controllers/StatsController';

export function createStatsRoutes(): Router {
  const router = Router();
  const controller = container.resolve(StatsController);

  // GET /api/v1/stats/platform - Get platform-wide statistics
  router.get('/platform', controller.getPlatformStats.bind(controller));

  // POST /api/v1/stats/refresh - Force refresh statistics (admin only in production)
  router.post('/refresh', controller.refreshStats.bind(controller));

  return router;
}
