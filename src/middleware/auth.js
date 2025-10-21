/**
 * Authentication Middleware
 * Extracts and validates API credentials from request
 */

export const extractCredentials = (req, res, next) => {
  try {
    // Extract API credentials from headers or body
    const apiKey = req.headers['x-api-key'] || req.body?.apiKey;
    const secretKey = req.headers['x-secret-key'] || req.body?.secretKey;

    // Store credentials in request object for use in controllers
    req.credentials = {
      apiKey,
      secretKey
    };

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process authentication credentials'
    });
  }
};

export const requireCredentials = (req, res, next) => {
  const { apiKey, secretKey } = req.credentials || {};

  if (!apiKey || !secretKey) {
    return res.status(401).json({
      success: false,
      error: 'API Key and Secret Key are required',
      hint: 'Provide credentials via headers (x-api-key, x-secret-key) or request body (apiKey, secretKey)'
    });
  }

  next();
};

