import express from 'express';
import {
  getUnifiedBalance,
  getXtBalance,
  getBybitBalance,
  xtBuyOrder,
  xtSellOrder,
  bybitBuyOrder,
  bybitSellOrder
} from '../controllers/unified.controller.js';

const router = express.Router();

// Balance Routes
router.get('/balance', getUnifiedBalance);           // Get combined balance from both exchanges
router.get('/balance/xt', getXtBalance);             // Get XT balance only
router.get('/balance/bybit', getBybitBalance);       // Get Bybit balance only

// XT Trading Routes
router.post('/xt/buy', xtBuyOrder);                  // XT Buy Order
router.post('/xt/sell', xtSellOrder);                // XT Sell Order

// Bybit Trading Routes
router.post('/bybit/buy', bybitBuyOrder);            // Bybit Buy Order
router.post('/bybit/sell', bybitSellOrder);          // Bybit Sell Order

export default router;
