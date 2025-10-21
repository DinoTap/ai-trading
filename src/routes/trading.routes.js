import express from 'express';
import {
  getBalance,
  getPortfolio,
  buyOrder,
  sellOrder,
  cancelOrder,
  getOrderHistory,
  getTicker,
  getSymbols,
  getDepth
} from '../controllers/trading.controller.js';
import { validateTradeRequest, validateOrderType } from '../middleware/validation.js';

const router = express.Router();

// Balance and Portfolio routes
router.get('/balance', getBalance);
router.get('/portfolio', getPortfolio);

// Trading routes
router.post('/buy', validateTradeRequest, validateOrderType, buyOrder);
router.post('/sell', validateTradeRequest, validateOrderType, sellOrder);

// Order management routes
router.get('/orders', getOrderHistory);
router.delete('/orders/:orderId', cancelOrder);

// Market data routes
router.get('/symbols', getSymbols);
router.get('/ticker/:symbol', getTicker);
router.get('/depth/:symbol', getDepth);

export default router;

