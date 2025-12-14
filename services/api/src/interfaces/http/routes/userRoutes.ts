import { Router } from 'express';
import { container } from 'tsyringe';
import { UserController } from '../controllers/UserController';

export function createUserRoutes(): Router {
  const router = Router();
  const controller = container.resolve(UserController);

  // Preferences routes
  router.get('/:wallet/preferences', controller.getPreferences.bind(controller));
  router.put('/:wallet/preferences', controller.updatePreferences.bind(controller));
  router.delete('/:wallet/preferences', controller.deletePreferences.bind(controller));

  // Analytics routes
  router.get('/:wallet/analytics', controller.getAnalytics.bind(controller));
  router.get('/:wallet/activities', controller.getActivities.bind(controller));
  router.post('/:wallet/activities', controller.recordActivity.bind(controller));

  // Export route
  router.get('/:wallet/export', controller.exportData.bind(controller));

  return router;
}
