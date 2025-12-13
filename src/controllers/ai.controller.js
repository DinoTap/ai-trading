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
console.log('provider', provider);
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string'
      });
    }

    // Validate provider
    const normalizedProvider = (provider || 'chaingpt').toLowerCase();
    if (!['gemini', 'chaingpt', 'both'].includes(normalizedProvider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider. Must be "gemini", "chaingpt", or "both"'
      });
    }

    let aiService;
    let providerName;

    // Select AI service based on provider
    if (normalizedProvider === 'chaingpt') {
      aiService = chainGPTService;
      providerName = 'ChainGPT';
    } else if (normalizedProvider === 'gemini') {
      aiService = geminiService;
      providerName = 'Gemini';
    } else if (normalizedProvider === 'both') {
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
    console.log('Error in AI chat:', error);
    
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
    console.log('Error checking AI status:', error);
    
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
    console.log('Error fetching real-time price:', error);
    
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
    console.log('Error fetching market analysis:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch market analysis'
    });
  }
};

// Analyze crypto portfolio
export const analyzePortfolio = async (req, res) => {
  try {
    const { portfolio } = req.body;

    // Validate portfolio data
    if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Portfolio is required and must be a non-empty array. Format: [{ token: "BTC", amount: 0.5 }, { token: "ETH", amount: 10 }]'
      });
    }

    // Validate each portfolio item
    for (const item of portfolio) {
      if (!item.token || !item.amount) {
        return res.status(400).json({
          success: false,
          error: 'Each portfolio item must have "token" and "amount" fields'
        });
      }
    }

    // Check if Gemini is configured
    const isConfigured = await geminiService.isConfigured();
    if (!isConfigured) {
      return res.status(503).json({
        success: false,
        error: 'Gemini service is not configured. Please set up the API key.'
      });
    }

    // Format portfolio data for the prompt
    const portfolioText = portfolio.map(item => 
      `- ${item.token.toUpperCase()}: ${item.amount}`
    ).join('\n');

    // Create the comprehensive analysis prompt
    const analysisPrompt = `You are a professional crypto portfolio analyst with experience in risk management, tokenomics, and market cycles.

I will provide my crypto portfolio details below. Your task is to deliver a clear, structured, and honest financial analysis.

For this portfolio, please do the following:

**Portfolio Overview**
- Break down allocations by asset, sector (L1, L2, DeFi, AI, Memes, Infrastructure, etc.), and market cap tier (large, mid, small).
- Identify concentration risks and overexposure.

**Risk Analysis**
- Assess downside risk, volatility, and correlation between assets.
- Highlight tokens with high regulatory, liquidity, or execution risk.
- Comment on bear-market survivability.

**Performance Outlook**
- Provide short-term (3–6 months) and long-term (1–3 years) outlooks.
- Explain assumptions clearly (market cycle, BTC dominance, macro trends).

**Capital Efficiency**
- Identify underperforming or redundant holdings.
- Flag tokens that do not justify their portfolio weight.

**Optimization Suggestions**
- Suggest rebalancing actions with reasoning.
- Recommend allocation ranges, not exact prices.
- Include conservative, balanced, and aggressive strategy options.

**Scenario Analysis**
Explain how the portfolio performs in:
- Bull market
- Sideways market
- Sharp market correction

**Final Summary**
- Strengths of the portfolio
- Key weaknesses
- Top 3 actionable improvements

**Constraints:**
- Do not provide financial disclaimers.
- Avoid generic advice.
- Base conclusions on logic, market structure, and risk principles.
- Be direct and realistic, not overly optimistic.

Here is my portfolio data:

${portfolioText}

Please provide a comprehensive analysis following the structure above.`;

    // Send to Gemini
    const analysis = await geminiService.sendMessage(analysisPrompt);

    res.json({
      success: true,
      data: {
        portfolio: portfolio,
        analysis: analysis,
        timestamp: new Date().toISOString(),
        provider: 'Gemini'
      }
    });
  } catch (error) {
    console.log('Error analyzing portfolio:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze portfolio'
    });
  }
};

// Update Gemini API key dynamically
export const updateGeminiApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'API key is required and must be a non-empty string'
      });
    }

    // Update the API key in the service
    geminiService.setApiKey(apiKey);

    res.json({
      success: true,
      message: 'Gemini API key updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('Error updating Gemini API key:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update API key'
    });
  }
};

