import { geminiService } from '../services/gemini.service.js';
import { chainGPTService } from '../services/chaingpt.service.js';

/**
 * AI Chat Controller
 * Handles AI chat interactions with crypto/blockchain focus
 * Supports both Gemini (general AI) and ChainGPT (real-time crypto data)
 */

// Send a message to the AI
export const sendMessage = async (req, res) => {
  try {
    const { message, provider = 'chaingpt' } = req.body; // Default to ChainGPT for real-time data

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string'
      });
    }

    // Validate provider
    if (!['gemini', 'chaingpt', 'both'].includes(provider.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider. Must be "gemini", "chaingpt", or "both"'
      });
    }

    let aiService;
    let providerName;

    // Select AI service based on provider
    if (provider.toLowerCase() === 'chaingpt') {
      aiService = chainGPTService;
      providerName = 'ChainGPT';
    } else if (provider.toLowerCase() === 'gemini') {
      aiService = geminiService;
      providerName = 'Gemini';
    } else if (provider.toLowerCase() === 'both') {
      // Get responses from both providers for comparison
      const results = await Promise.allSettled([
        chainGPTService.isConfigured() ? chainGPTService.sendMessage(message) : Promise.reject('ChainGPT not configured'),
        geminiService.isConfigured() ? geminiService.sendMessage(message) : Promise.reject('Gemini not configured')
      ]);

      const responses = {};
      
      if (results[0].status === 'fulfilled') {
        responses.chaingpt = {
          message: results[0].value,
          timestamp: new Date().toISOString()
        };
      } else {
        responses.chaingpt = {
          error: 'ChainGPT unavailable or not configured',
          timestamp: new Date().toISOString()
        };
      }

      if (results[1].status === 'fulfilled') {
        responses.gemini = {
          message: results[1].value,
          timestamp: new Date().toISOString()
        };
      } else {
        responses.gemini = {
          error: 'Gemini unavailable or not configured',
          timestamp: new Date().toISOString()
        };
      }

      return res.json({
        success: true,
        data: {
          provider: 'both',
          responses,
          recommendation: 'Use ChainGPT for real-time prices and market data, use Gemini for general analysis'
        }
      });
    }

    // Check if AI is configured
    const isConfigured = await aiService.isConfigured();
    if (!isConfigured) {
      return res.status(503).json({
        success: false,
        error: `${providerName} service is not configured. Please set up the API key.`
      });
    }

    // Send message to selected AI
    const response = await aiService.sendMessage(message);

    res.json({
      success: true,
      data: {
        provider: providerName,
        message: response,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing your request'
    });
  }
};

// Check AI service status
export const getStatus = async (req, res) => {
  try {
    const geminiConfigured = await geminiService.isConfigured();
    const chaingptConfigured = await chainGPTService.isConfigured();
    
    res.json({
      success: true,
      data: {
        providers: {
          gemini: {
            status: geminiConfigured ? 'operational' : 'unavailable',
            model: 'gemini-2.0-flash',
            features: ['general-crypto-analysis', 'blockchain-education', 'trading-strategies'],
            realtime: false
          },
          chaingpt: {
            status: chaingptConfigured ? 'operational' : 'unavailable',
            model: 'gpt-4-turbo',
            features: ['real-time-prices', 'live-market-analysis', 'on-chain-data', 'current-trends'],
            realtime: true
          }
        },
        recommendation: 'Use ChainGPT for real-time market data and prices. Use Gemini for general crypto education and strategy discussions.',
        defaultProvider: 'chaingpt'
      }
    });
  } catch (error) {
    console.error('Error checking AI status:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to check AI service status'
    });
  }
};

// Get real-time price for a specific cryptocurrency (ChainGPT only)
export const getRealTimePrice = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }

    const isConfigured = await chainGPTService.isConfigured();
    if (!isConfigured) {
      return res.status(503).json({
        success: false,
        error: 'ChainGPT service is not configured. Please set up the API key.'
      });
    }

    const priceData = await chainGPTService.getRealTimePrice(symbol);

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        ...priceData,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching real-time price:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch real-time price'
    });
  }
};

// Get market analysis for a specific cryptocurrency (ChainGPT only)
export const getMarketAnalysis = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }

    const isConfigured = await chainGPTService.isConfigured();
    if (!isConfigured) {
      return res.status(503).json({
        success: false,
        error: 'ChainGPT service is not configured. Please set up the API key.'
      });
    }

    const analysis = await chainGPTService.getMarketAnalysis(symbol);

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        analysis: analysis,
        timestamp: new Date().toISOString(),
        provider: 'ChainGPT'
      }
    });
  } catch (error) {
    console.error('Error fetching market analysis:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch market analysis'
    });
  }
};

