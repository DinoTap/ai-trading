import xtService from '../services/xt.service.js';

export const getBalance = async (req, res) => {
  try {
    // Extract API credentials from headers or body
    const apiKey = req.headers['x-api-key'] || req.body.apiKey;
    const secretKey = req.headers['x-secret-key'] || req.body.secretKey;

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'API Key and Secret Key are required. Provide them in headers (x-api-key, x-secret-key) or request body (apiKey, secretKey)'
      });
    }

    const result = await xtService.getBalance(apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch balance'
    });
  }
};

export const getPortfolio = async (req, res) => {
  try {
    // Extract API credentials from headers or body
    const apiKey = req.headers['x-api-key'] || req.body.apiKey;
    const secretKey = req.headers['x-secret-key'] || req.body.secretKey;

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'API Key and Secret Key are required. Provide them in headers (x-api-key, x-secret-key) or request body (apiKey, secretKey)'
      });
    }

    const result = await xtService.getPortfolio(apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch portfolio'
    });
  }
};

export const buyOrder = async (req, res) => {
  try {
    const { symbol, quantity, price, type = 'LIMIT' } = req.body;

    // Extract API credentials from headers or body
    const apiKey = req.headers['x-api-key'] || req.body.apiKey;
    const secretKey = req.headers['x-secret-key'] || req.body.secretKey;

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'API Key and Secret Key are required. Provide them in headers (x-api-key, x-secret-key) or request body (apiKey, secretKey)'
      });
    }

    const result = await xtService.placeBuyOrder(symbol, quantity, price, type, apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to place buy order'
    });
  }
};

export const sellOrder = async (req, res) => {
  try {
    const { symbol, quantity, price, type = 'LIMIT' } = req.body;

    // Extract API credentials from headers or body
    const apiKey = req.headers['x-api-key'] || req.body.apiKey;
    const secretKey = req.headers['x-secret-key'] || req.body.secretKey;

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'API Key and Secret Key are required. Provide them in headers (x-api-key, x-secret-key) or request body (apiKey, secretKey)'
      });
    }

    const result = await xtService.placeSellOrder(symbol, quantity, price, type, apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to place sell order'
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    // Extract API credentials from headers or body
    const apiKey = req.headers['x-api-key'] || req.body.apiKey;
    const secretKey = req.headers['x-secret-key'] || req.body.secretKey;

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'API Key and Secret Key are required. Provide them in headers (x-api-key, x-secret-key) or request body (apiKey, secretKey)'
      });
    }

    const result = await xtService.cancelOrder(orderId, apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel order'
    });
  }
};

export const getOrderHistory = async (req, res) => {
  try {
    const { symbol, limit = 100 } = req.query;

    // Extract API credentials from headers or body
    const apiKey = req.headers['x-api-key'] || req.body.apiKey;
    const secretKey = req.headers['x-secret-key'] || req.body.secretKey;

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'API Key and Secret Key are required. Provide them in headers (x-api-key, x-secret-key) or request body (apiKey, secretKey)'
      });
    }

    const result = await xtService.getOrderHistory(symbol, parseInt(limit), apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch order history'
    });
  }
};

export const getTicker = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }

    // Extract API credentials from headers or body
    const apiKey = req.headers['x-api-key'] || req.body.apiKey;
    const secretKey = req.headers['x-secret-key'] || req.body.secretKey;

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'API Key and Secret Key are required. Provide them in headers (x-api-key, x-secret-key) or request body (apiKey, secretKey)'
      });
    }

    const result = await xtService.getTicker(symbol, apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch ticker'
    });
  }
};

export const getSymbols = async (req, res) => {
  try {
    // Extract API credentials from headers or body
    const apiKey = req.headers['x-api-key'] || req.body.apiKey;
    const secretKey = req.headers['x-secret-key'] || req.body.secretKey;

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'API Key and Secret Key are required. Provide them in headers (x-api-key, x-secret-key) or request body (apiKey, secretKey)'
      });
    }

    const result = await xtService.getSymbols(apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch symbols'
    });
  }
};

export const getDepth = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 20 } = req.query;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }

    // Extract API credentials from headers or body
    const apiKey = req.headers['x-api-key'] || req.body.apiKey;
    const secretKey = req.headers['x-secret-key'] || req.body.secretKey;

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'API Key and Secret Key are required. Provide them in headers (x-api-key, x-secret-key) or request body (apiKey, secretKey)'
      });
    }

    const result = await xtService.getDepth(symbol, parseInt(limit), apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch depth'
    });
  }
};

