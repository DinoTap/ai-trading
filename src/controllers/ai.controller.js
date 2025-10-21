import { geminiService } from '../services/gemini.service.js';

/**
 * AI Chat Controller
 * Handles AI chat interactions with crypto/blockchain focus
 */

// Send a message to the AI
export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string'
      });
    }

    // Check if AI is configured
    const isConfigured = await geminiService.isConfigured();
    if (!isConfigured) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not available. Please try again later.'
      });
    }

    // Send message to Gemini AI
    const response = await geminiService.sendMessage(message);

    res.json({
      success: true,
      data: {
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
    const isConfigured = await geminiService.isConfigured();
    
    res.json({
      success: true,
      data: {
        status: isConfigured ? 'operational' : 'unavailable',
        model: isConfigured ? 'gemini-1.5-flash' : null,
        features: ['crypto-trading', 'blockchain-analysis', 'market-insights']
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

