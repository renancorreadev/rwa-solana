import { Router } from 'express';
import { container } from 'tsyringe';
import { InvestController } from '../controllers/InvestController';

export function createInvestRoutes(): Router {
  const router = Router();
  const investController = container.resolve(InvestController);

  // GET /api/v1/invest/price - Get current SOL price
  router.get('/price', (req, res, next) => investController.getSolPrice(req, res, next));

  // GET /api/v1/invest/quote - Get investment quote with fee breakdown
  router.get('/quote', (req, res, next) => investController.getQuote(req, res, next));

  // POST /api/v1/invest - Process investment (with payment verification)
  router.post('/', (req, res, next) => investController.invest(req, res, next));

  return router;
}
