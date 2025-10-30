import xtService from '../services/xt.service.js';
import bybitService from '../services/bybit.service.js';

/**
 * Unified Balance API - Get balances from both XT and Bybit
 */
export const getUnifiedBalance = async (req, res) => {
  try {
    // Extract API credentials from headers
    const xtApiKey = req.headers['x-xt-api-key'];
    const xtSecretKey = req.headers['x-xt-secret-key'];
    const bybitApiKey = req.headers['x-bybit-api-key'];
    const bybitSecretKey = req.headers['x-bybit-secret-key'];

    const results = [];
    const errors = [];

    // Fetch XT balance if credentials provided
    if (xtApiKey && xtSecretKey) {
      try {
        console.log('Fetching XT balance...');
        const xtResult = await xtService.getPortfolio(xtApiKey, xtSecretKey);
        if (xtResult.success) {
          results.push({
            exchange: 'xt',
            data: xtResult.data,
            timestamp: new Date().toISOString()
          });
        } else {
          errors.push({ 
            exchange: 'xt', 
            error: xtResult.error,
            code: xtResult.code 
          });
        }
      } catch (error) {
        errors.push({ 
          exchange: 'xt', 
          error: error.message 
        });
      }
    }

    // Fetch Bybit balance if credentials provided
    if (bybitApiKey && bybitSecretKey) {
      try {
        console.log('Fetching Bybit balance...');
        const bybitResult = await bybitService.getPortfolio(bybitApiKey, bybitSecretKey);
        if (bybitResult.success) {
          results.push({
            exchange: 'bybit',
            data: bybitResult.data,
            timestamp: new Date().toISOString()
          });
        } else {
          errors.push({ 
            exchange: 'bybit', 
            error: bybitResult.error,
            code: bybitResult.code 
          });
        }
      } catch (error) {
        errors.push({ 
          exchange: 'bybit', 
          error: error.message 
        });
      }
    }

    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid exchange credentials provided',
        errors: errors,
        requiredHeaders: {
          'x-xt-api-key': 'XT API Key',
          'x-xt-secret-key': 'XT Secret Key',
          'x-bybit-api-key': 'Bybit API Key',
          'x-bybit-secret-key': 'Bybit Secret Key'
        }
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
      error: error.message || 'Failed to fetch unified balance'
    });
  }
};

/**
 * XT Buy Order API
 */
export const xtBuyOrder = async (req, res) => {
  try {
    const { symbol, quantity, price, type = 'LIMIT' } = req.body;
    
    // Extract API credentials from headers
    const apiKey = req.headers['x-xt-api-key'];
    const secretKey = req.headers['x-xt-secret-key'];

    // Enforce price rules: LIMIT requires price; MARKET must not include price
    const normalizedType = (type || 'LIMIT').toString().toUpperCase();
    if (normalizedType === 'LIMIT' && (price === undefined || price === null)) {
      return res.status(400).json({ success: false, error: 'Price is required for LIMIT orders' });
    }
    if (normalizedType === 'MARKET' && (price !== undefined && price !== null)) {
      return res.status(400).json({ success: false, error: 'Do not send price for MARKET orders' });
    }

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'XT API credentials are required in headers: x-xt-api-key, x-xt-secret-key'
      });
    }

    if (!symbol || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Symbol and quantity are required'
      });
    }

    const result = await xtService.placeBuyOrder(symbol, quantity, price, type, apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      ...result,
      exchange: 'xt'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to place XT buy order'
    });
  }
};

/**
 * XT Sell Order API
 */
export const xtSellOrder = async (req, res) => {
  try {
    const { symbol, quantity, price, type = 'LIMIT' } = req.body;
    
    // Extract API credentials from headers
    const apiKey = req.headers['x-xt-api-key'];
    const secretKey = req.headers['x-xt-secret-key'];

    // Enforce price rules: LIMIT requires price; MARKET must not include price
    const normalizedType = (type || 'LIMIT').toString().toUpperCase();
    if (normalizedType === 'LIMIT' && (price === undefined || price === null)) {
      return res.status(400).json({ success: false, error: 'Price is required for LIMIT orders' });
    }
    if (normalizedType === 'MARKET' && (price !== undefined && price !== null)) {
      return res.status(400).json({ success: false, error: 'Do not send price for MARKET orders' });
    }

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'XT API credentials are required in headers: x-xt-api-key, x-xt-secret-key'
      });
    }

    if (!symbol || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Symbol and quantity are required'
      });
    }

    const result = await xtService.placeSellOrder(symbol, quantity, price, type, apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      ...result,
      exchange: 'xt'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to place XT sell order'
    });
  }
};

/**
 * Bybit Buy Order API
 */
export const bybitBuyOrder = async (req, res) => {
  try {
    const { symbol, quantity, price, type = 'LIMIT' } = req.body;
    
    // Extract API credentials from headers
    const apiKey = req.headers['x-bybit-api-key'];
    const secretKey = req.headers['x-bybit-secret-key'];

    // Enforce price rules: LIMIT requires price; MARKET must not include price
    const normalizedType = (type || 'LIMIT').toString().toUpperCase();
    if (normalizedType === 'LIMIT' && (price === undefined || price === null)) {
      return res.status(400).json({ success: false, error: 'Price is required for LIMIT orders' });
    }
    if (normalizedType === 'MARKET' && (price !== undefined && price !== null)) {
      return res.status(400).json({ success: false, error: 'Do not send price for MARKET orders' });
    }

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'Bybit API credentials are required in headers: x-bybit-api-key, x-bybit-secret-key'
      });
    }

    if (!symbol || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Symbol and quantity are required'
      });
    }

    const result = await bybitService.placeBuyOrder(symbol, quantity, price, type, apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      ...result,
      exchange: 'bybit'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to place Bybit buy order'
    });
  }
};

/**
 * Bybit Sell Order API
 */
export const bybitSellOrder = async (req, res) => {
  try {
    const { symbol, quantity, price, type = 'LIMIT' } = req.body;
    
    // Extract API credentials from headers
    const apiKey = req.headers['x-bybit-api-key'];
    const secretKey = req.headers['x-bybit-secret-key'];

    // Enforce price rules: LIMIT requires price; MARKET must not include price
    const normalizedType = (type || 'LIMIT').toString().toUpperCase();
    if (normalizedType === 'LIMIT' && (price === undefined || price === null)) {
      return res.status(400).json({ success: false, error: 'Price is required for LIMIT orders' });
    }
    if (normalizedType === 'MARKET' && (price !== undefined && price !== null)) {
      return res.status(400).json({ success: false, error: 'Do not send price for MARKET orders' });
    }

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'Bybit API credentials are required in headers: x-bybit-api-key, x-bybit-secret-key'
      });
    }

    if (!symbol || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Symbol and quantity are required'
      });
    }

    const result = await bybitService.placeSellOrder(symbol, quantity, price, type, apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      ...result,
      exchange: 'bybit'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to place Bybit sell order'
    });
  }
};

/**
 * Get XT Balance Only
 */
export const getXtBalance = async (req, res) => {
  try {
    const apiKey = req.headers['x-xt-api-key'];
    const secretKey = req.headers['x-xt-secret-key'];

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'XT API credentials are required in headers: x-xt-api-key, x-xt-secret-key'
      });
    }

    const result = await xtService.getPortfolio(apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      ...result,
      exchange: 'xt'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch XT balance'
    });
  }
};

/**
 * Get Bybit Balance Only
 */
export const getBybitBalance = async (req, res) => {
  try {
    const apiKey = req.headers['x-bybit-api-key'];
    const secretKey = req.headers['x-bybit-secret-key'];

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        error: 'Bybit API credentials are required in headers: x-bybit-api-key, x-bybit-secret-key'
      });
    }

    const result = await bybitService.getPortfolio(apiKey, secretKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      ...result,
      exchange: 'bybit'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Bybit balance'
    });
  }
};
