import express from 'express';
import {
  getUnifiedBalance,
  getXtBalance,
  getBybitBalance,
  getBinanceBalance,
  getKucoinBalance,
  xtBuyOrder,
  xtSellOrder,
  bybitBuyOrder,
  bybitSellOrder,
  binanceBuyOrder,
  binanceSellOrder,
  kucoinBuyOrder,
  kucoinSellOrder
} from '../controllers/unified.controller.js';

const router = express.Router();

// Balance Routes
router.get('/balance', getUnifiedBalance);           // Get combined balance from all exchanges
router.get('/balance/xt', getXtBalance);             // Get XT balance only
router.get('/balance/bybit', getBybitBalance);       // Get Bybit balance only
router.get('/balance/binance', getBinanceBalance);   // Get Binance balance only
router.get('/balance/kucoin', getKucoinBalance);     // Get KuCoin balance only

// XT Trading Routes
router.post('/xt/buy', xtBuyOrder);                  // XT Buy Order
router.post('/xt/sell', xtSellOrder);                // XT Sell Order

// Bybit Trading Routes
router.post('/bybit/buy', bybitBuyOrder);            // Bybit Buy Order
router.post('/bybit/sell', bybitSellOrder);          // Bybit Sell Order

// Binance Trading Routes
router.post('/binance/buy', binanceBuyOrder);        // Binance Buy Order
router.post('/binance/sell', binanceSellOrder);      // Binance Sell Order

// KuCoin Trading Routes
router.post('/kucoin/buy', kucoinBuyOrder);          // KuCoin Buy Order
router.post('/kucoin/sell', kucoinSellOrder);        // KuCoin Sell Order

export default router;
