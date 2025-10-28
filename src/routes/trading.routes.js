import express from 'express';
import {
  getBalance,
  getPortfolio,
  getCombinedPortfolio,
  buyOrder,
  sellOrder,
  cancelOrder,
  getOrderHistory,
  getTicker,
  getSymbols,
  getDepth,
  testBybitConnection
} from '../controllers/trading.controller.js';
import { validateTradeRequest, validateOrderType, validateExchange } from '../middleware/validation.js';

const router = express.Router();

// Test routes
router.get('/test/bybit', testBybitConnection);

// Balance and Portfolio routes
router.get('/balance', validateExchange, getBalance);
router.get('/portfolio', validateExchange, getPortfolio);
router.get('/portfolio/combined', getCombinedPortfolio);

// Trading routes
router.post('/buy', validateTradeRequest, validateOrderType, validateExchange, buyOrder);
router.post('/sell', validateTradeRequest, validateOrderType, validateExchange, sellOrder);

// Order management routes
router.get('/orders', validateExchange, getOrderHistory);
router.delete('/orders/:orderId', validateExchange, cancelOrder);

// Market data routes
router.get('/symbols', validateExchange, getSymbols);
router.get('/ticker/:symbol', validateExchange, getTicker);
router.get('/depth/:symbol', validateExchange, getDepth);

export default router;

