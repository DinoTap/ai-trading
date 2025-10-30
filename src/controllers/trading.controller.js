import xtService from '../services/xt.service.js';
import bybitService from '../services/bybit.service.js';

// Helper function to get the appropriate service
const getService = (exchange) => {
  switch (exchange?.toLowerCase()) {
    case 'bybit':
      return bybitService;
    case 'xt':
    default:
      return xtService;
  }
};

// Helper function to validate exchange parameter
const validateExchange = (exchange) => {
  const validExchanges = ['xt', 'bybit'];
  if (!exchange || !validExchanges.includes(exchange.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid exchange. Must be one of: ${validExchanges.join(', ')}`
    };
  }
  return { valid: true };
};

export const getBalance = async (req, res) => {
  try {
    // Extract exchange parameter
    const exchange = req.query.exchange || req.body.exchange || 'xt';
    
    // Validate exchange
    const exchangeValidation = validateExchange(exchange);
    if (!exchangeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: exchangeValidation.error
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

    const service = getService(exchange);
    const result = await service.getBalance(apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      ...result,
      exchange: exchange.toLowerCase()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch balance'
    });
  }
};

export const getPortfolio = async (req, res) => {
  try {
    // Extract exchange parameter
    const exchange = req.query.exchange || req.body.exchange || 'xt';
    
    // Validate exchange
    const exchangeValidation = validateExchange(exchange);
    if (!exchangeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: exchangeValidation.error
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

    const service = getService(exchange);
    const result = await service.getPortfolio(apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      ...result,
      exchange: exchange.toLowerCase()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch portfolio'
    });
  }
};

// New function for combined portfolio across exchanges
export const getCombinedPortfolio = async (req, res) => {
  try {
    // Extract credentials for both exchanges
    const xtApiKey = req.headers['x-xt-api-key'] || req.body.xtApiKey;
    const xtSecretKey = req.headers['x-xt-secret-key'] || req.body.xtSecretKey;
    const bybitApiKey = req.headers['x-bybit-api-key'] || req.body.bybitApiKey;
    const bybitSecretKey = req.headers['x-bybit-secret-key'] || req.body.bybitSecretKey;

    const results = [];
    const errors = [];

    // Fetch XT portfolio if credentials provided
    if (xtApiKey && xtSecretKey) {
      try {
        const xtResult = await xtService.getPortfolio(xtApiKey, xtSecretKey);
        if (xtResult.success) {
          results.push({
            exchange: 'xt',
            ...xtResult
          });
        } else {
          errors.push({ exchange: 'xt', error: xtResult.error });
        }
      } catch (error) {
        errors.push({ exchange: 'xt', error: error.message });
      }
    }

    // Fetch Bybit portfolio if credentials provided
    if (bybitApiKey && bybitSecretKey) {
      try {
        const bybitResult = await bybitService.getPortfolio(bybitApiKey, bybitSecretKey);
        if (bybitResult.success) {
          results.push({
            exchange: 'bybit',
            ...bybitResult
          });
        } else {
          errors.push({ exchange: 'bybit', error: bybitResult.error });
        }
      } catch (error) {
        errors.push({ exchange: 'bybit', error: error.message });
      }
    }

    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid exchange credentials provided',
        errors: errors
      });
    }

    // Combine portfolios
    const combinedPortfolio = [];
    const exchangeData = {};

    results.forEach(result => {
      exchangeData[result.exchange] = result.data;
      if (result.data.portfolio) {
        result.data.portfolio.forEach(asset => {
          const existingAsset = combinedPortfolio.find(item => 
            item.currency.toLowerCase() === asset.currency.toLowerCase()
          );
          
          if (existingAsset) {
            // Combine assets from different exchanges
            existingAsset.total += asset.total;
            existingAsset.available += asset.available;
            existingAsset.frozen += asset.frozen;
            existingAsset.exchanges = existingAsset.exchanges || [existingAsset.exchange];
            existingAsset.exchanges.push(result.exchange);
          } else {
            // Add new asset
            combinedPortfolio.push({
              ...asset,
              exchanges: [result.exchange]
            });
          }
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        combinedPortfolio,
        totalAssets: combinedPortfolio.length,
        exchanges: exchangeData,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch combined portfolio'
    });
  }
};

export const buyOrder = async (req, res) => {
  try {
    const { symbol, quantity, price, type = 'LIMIT', exchange = 'xt' } = req.body;

    // Validate price presence for LIMIT, and absence for MARKET
    const normalizedType = (type || 'LIMIT').toString().toUpperCase();
    if (normalizedType === 'LIMIT' && (price === undefined || price === null)) {
      return res.status(400).json({
        success: false,
        error: 'Price is required for LIMIT orders'
      });
    }
    if (normalizedType === 'MARKET' && (price !== undefined && price !== null)) {
      return res.status(400).json({
        success: false,
        error: 'Do not send price for MARKET orders'
      });
    }

    // Validate exchange
    const exchangeValidation = validateExchange(exchange);
    if (!exchangeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: exchangeValidation.error
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

    const service = getService(exchange);
    const result = await service.placeBuyOrder(symbol, quantity, price, type, apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      ...result,
      exchange: exchange.toLowerCase()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to place buy order'
    });
  }
};

export const sellOrder = async (req, res) => {
  try {
    const { symbol, quantity, price, type = 'LIMIT', exchange = 'xt' } = req.body;

    // Validate price presence for LIMIT, and absence for MARKET
    const normalizedType = (type || 'LIMIT').toString().toUpperCase();
    if (normalizedType === 'LIMIT' && (price === undefined || price === null)) {
      return res.status(400).json({
        success: false,
        error: 'Price is required for LIMIT orders'
      });
    }
    if (normalizedType === 'MARKET' && (price !== undefined && price !== null)) {
      return res.status(400).json({
        success: false,
        error: 'Do not send price for MARKET orders'
      });
    }

    // Validate exchange
    const exchangeValidation = validateExchange(exchange);
    if (!exchangeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: exchangeValidation.error
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

    const service = getService(exchange);
    const result = await service.placeSellOrder(symbol, quantity, price, type, apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      ...result,
      exchange: exchange.toLowerCase()
    });
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
    const { exchange = 'xt' } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    // Validate exchange
    const exchangeValidation = validateExchange(exchange);
    if (!exchangeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: exchangeValidation.error
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

    const service = getService(exchange);
    const result = await service.cancelOrder(orderId, apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      ...result,
      exchange: exchange.toLowerCase()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel order'
    });
  }
};

export const getOrderHistory = async (req, res) => {
  try {
    const { symbol, limit = 100, exchange = 'xt' } = req.query;

    // Validate exchange
    const exchangeValidation = validateExchange(exchange);
    if (!exchangeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: exchangeValidation.error
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

    const service = getService(exchange);
    const result = await service.getOrderHistory(symbol, parseInt(limit), apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      ...result,
      exchange: exchange.toLowerCase()
    });
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
    const { exchange = 'xt' } = req.query;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }

    // Validate exchange
    const exchangeValidation = validateExchange(exchange);
    if (!exchangeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: exchangeValidation.error
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

    let service = getService(exchange);
    // Fallback if service implementation lacks getTicker (hot-reload or stale import issues)
    if (!service || typeof service.getTicker !== 'function') {
      service = exchange.toLowerCase() === 'bybit' ? bybitService : xtService;
    }
    if (!service || typeof service.getTicker !== 'function') {
      return res.status(500).json({ success: false, error: 'Ticker not supported for this exchange' });
    }
    const result = await service.getTicker(symbol, apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      ...result,
      exchange: exchange.toLowerCase()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch ticker'
    });
  }
};

export const getSymbols = async (req, res) => {
  try {
    const { exchange = 'xt' } = req.query;

    // Validate exchange
    const exchangeValidation = validateExchange(exchange);
    if (!exchangeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: exchangeValidation.error
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

    let service = getService(exchange);
    if (!service || typeof service.getSymbols !== 'function') {
      service = exchange.toLowerCase() === 'bybit' ? bybitService : xtService;
    }
    if (!service || typeof service.getSymbols !== 'function') {
      return res.status(500).json({ success: false, error: 'Symbols not supported for this exchange' });
    }
    const result = await service.getSymbols(apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      ...result,
      exchange: exchange.toLowerCase()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch symbols'
    });
  }
};

// Test Bybit connection (no auth required)
export const testBybitConnection = async (req, res) => {
  try {
    const result = await bybitService.testConnection();
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test Bybit connection'
    });
  }
};

export const getDepth = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 20, exchange = 'xt' } = req.query;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }

    // Validate exchange
    const exchangeValidation = validateExchange(exchange);
    if (!exchangeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: exchangeValidation.error
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

    let service = getService(exchange);
    if (!service || typeof service.getDepth !== 'function') {
      service = exchange.toLowerCase() === 'bybit' ? bybitService : xtService;
    }
    if (!service || typeof service.getDepth !== 'function') {
      return res.status(500).json({ success: false, error: 'Depth not supported for this exchange' });
    }
    const result = await service.getDepth(symbol, parseInt(limit), apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      ...result,
      exchange: exchange.toLowerCase()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch depth'
    });
  }
};

