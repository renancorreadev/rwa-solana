import { Router } from 'express';
import { container } from 'tsyringe';
import { DividendController } from '../controllers/DividendController';

export function createDividendRoutes(): Router {
  const router = Router();
  const controller = container.resolve(DividendController);

  // Public investor endpoints
  router.get('/calendar/:wallet', controller.getCalendar.bind(controller));
  router.get('/history/:wallet', controller.getHistory.bind(controller));
  router.get('/stats/:wallet', controller.getStats.bind(controller));
  router.get('/yields/:wallet', controller.getPropertyYields.bind(controller));
  router.get('/projections/:wallet', controller.getProjections.bind(controller));
  router.get('/upcoming', controller.getUpcoming.bind(controller));

  return router;
}

export function createDividendAdminRoutes(): Router {
  const router = Router();
  const controller = container.resolve(DividendController);

  // Admin endpoints for managing scheduled distributions
  router.get('/schedules', controller.listScheduledDistributions.bind(controller));
  router.post('/schedule', controller.createScheduledDistribution.bind(controller));
  router.put('/schedule/:id', controller.updateScheduledDistribution.bind(controller));
  router.delete('/schedule/:id', controller.deleteScheduledDistribution.bind(controller));

  // Admin endpoint to cache claims from on-chain
  router.post('/cache-claim', controller.cacheClaim.bind(controller));

  return router;
}
