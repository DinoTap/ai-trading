import express from 'express';
import { 
  sendMessage, 
  getStatus, 
  getRealTimePrice, 
  getMarketAnalysis,
  analyzePortfolio
} from '../controllers/ai.controller.js';

const router = express.Router();

/**
 * AI Chat Routes
 * Base path: /api/ai
 * 
 * Supports two AI providers:
 * - Gemini: General crypto knowledge and strategies
 * - ChainGPT: Real-time prices, market data, and live analysis
 */

// POST /api/ai/chat - Send a message to the AI
// Body: { message: string, provider?: 'gemini' | 'chaingpt' | 'both' }
router.post('/chat', sendMessage);

// GET /api/ai/status - Get AI service status for all providers
router.get('/status', getStatus);

// GET /api/ai/price/:symbol - Get real-time price for a cryptocurrency (ChainGPT)
// Example: /api/ai/price/BTC
router.get('/price/:symbol', getRealTimePrice);

// GET /api/ai/analysis/:symbol - Get real-time market analysis (ChainGPT)
// Example: /api/ai/analysis/ETH
router.get('/analysis/:symbol', getMarketAnalysis);

// POST /api/ai/portfolio/analyze - Analyze crypto portfolio (Gemini)
// Body: { portfolio: [{ token: "BTC", amount: 0.5 }, { token: "ETH", amount: 10 }] }
router.post('/portfolio/analyze', analyzePortfolio);

export default router;

