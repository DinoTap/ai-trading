export const validateTradeRequest = (req, res, next) => {
  const { symbol, quantity } = req.body;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Symbol is required and must be a string'
    });
  }

  if (!quantity || isNaN(quantity) || parseFloat(quantity) <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Quantity is required and must be a positive number'
    });
  }

  next();
};

export const validateOrderType = (req, res, next) => {
  const { type } = req.body;
  const validTypes = ['LIMIT', 'MARKET'];

  if (type && !validTypes.includes(type.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid order type. Must be one of: ${validTypes.join(', ')}`
    });
  }

  next();
};

