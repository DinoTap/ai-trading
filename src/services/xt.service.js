import axios from 'axios';
import crypto from 'crypto';

class XTService {
  /**
   * Make authenticated request to XT API
   * This replaces the xt-open-api library's makeRequest to support dynamic credentials
   */
  async makeRequest(apiKey, secretKey, method, path, query = null, body = null) {
    const baseUrl = 'https://sapi.xt.com';
    
    if (!apiKey || !secretKey) {
      throw new Error('API Key and Secret Key are required');
    }

    // Build headers
    const headerPairs = [
      ['validate-algorithms', 'HmacSHA256'],
      ['validate-appkey', apiKey],
      ['validate-recvwindow', '60000'],
      ['validate-timestamp', Date.now().toString()]
    ];

    const X = headerPairs.map(t => t.join('=')).join('&');
    
    const queryStr = query && Object.keys(this.trimObject(query)).length 
      ? `#${this.sortQueryParams(query)}` 
      : '';
    
    const bodyStr = body && Object.keys(this.trimObject(body)).length 
      ? `#${JSON.stringify(body)}` 
      : '';
    
    const Y = `#${method}#${path}${queryStr}${bodyStr}`;
    
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(`${X}${Y}`)
      .digest('hex');

    headerPairs.push(['validate-signature', signature]);
    const headers = headerPairs.reduce((r, t) => ((r[t[0]] = t[1]), r), {});

    const options = {
      method: method,
      url: `${baseUrl}${path}${queryStr && encodeURI(queryStr.replace('#', '?'))}`,
      headers: headers,
      data: body
    };

    try {
      const response = await axios(options);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  sortQueryParams(queryObject) {
    let sortResult = '';
    Object.keys(queryObject)
      .sort((a, b) => a.localeCompare(b))
      .forEach((key) => {
        if (typeof queryObject[key] === 'undefined') return;
        sortResult += `${(sortResult && '&') || ''}${key}=${queryObject[key]}`;
      });
    return sortResult;
  }

  trimObject(obj) {
    const und = void 0;
    for (let key in obj) {
      obj[key] === und && delete obj[key];
    }
    return obj;
  }

  /**
   * Get account balance
   */
  async getBalance(apiKey, secretKey) {
    try {
      console.log('Fetching balance from XT Exchange...');
      const response = await this.makeRequest(apiKey, secretKey, 'GET', '/v4/balances');
      
      console.log('XT Balance Response:', response);
      
      if (response.rc !== 0) {
        return {
          success: false,
          error: response.mc || 'Failed to fetch balance',
          code: response.rc
        };
      }

      // Ensure we always return an array
      let balanceData = response.result || [];
      let metadata = {};
      
      if (!Array.isArray(balanceData)) {
        console.log('Balance result is not an array, wrapping or converting:', balanceData);
        // If it's an object with assets property, try to use that
        if (balanceData.assets && Array.isArray(balanceData.assets)) {
          metadata = {
            totalUsdtAmount: balanceData.totalUsdtAmount,
            totalBtcAmount: balanceData.totalBtcAmount
          };
          balanceData = balanceData.assets;
        } else {
          balanceData = [];
        }
      }

      return {
        success: true,
        data: balanceData,
        metadata: metadata
      };
    } catch (error) {
      console.log('Balance Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch balance'
      };
    }
  }

  /**
   * Get portfolio (all balances with current prices)
   */
  async getPortfolio(apiKey, secretKey) {
    try {
      const balanceResponse = await this.getBalance(apiKey, secretKey);
      
      if (!balanceResponse.success) {
        return balanceResponse;
      }

      const balances = balanceResponse.data;
      const portfolio = [];

      // Check if balances is actually an array
      if (!Array.isArray(balances)) {
        console.log('Balances is not an array:', balances);
        return {
          success: false,
          error: 'Invalid balance data structure',
          data: balances
        };
      }

      // Filter out zero balances and format
      for (const balance of balances) {
        // XT API uses different field names: availableAmount, frozenAmount, totalAmount
        const available = parseFloat(balance.availableAmount || balance.available || 0);
        const frozen = parseFloat(balance.frozenAmount || balance.frozen || balance.freeze || 0);
        const total = parseFloat(balance.totalAmount) || (available + frozen);

        if (total > 0) {
          portfolio.push({
            currency: balance.currency,
            currencyId: balance.currencyId,
            available: available,
            frozen: frozen,
            total: total,
            convertBtcAmount: balance.convertBtcAmount,
            convertUsdtAmount: balance.convertUsdtAmount
          });
        }
      }

      return {
        success: true,
        data: {
          portfolio,
          totalAssets: portfolio.length,
          totalUsdtAmount: balanceResponse.metadata?.totalUsdtAmount || '0',
          totalBtcAmount: balanceResponse.metadata?.totalBtcAmount || '0',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.log('Portfolio Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch portfolio'
      };
    }
  }

  /**
   * Get symbol info by symbol name
   */
  async getSymbolInfo(symbol, apiKey, secretKey) {
    try {
      const symbolsResponse = await this.getSymbols(apiKey, secretKey);
      if (!symbolsResponse.success) {
        return null;
      }

      const symbols = symbolsResponse.data?.symbols || [];
      const normalizedSymbol = symbol.toLowerCase().replace('_', '');
      
      return symbols.find(s => 
        s.symbol.toLowerCase() === normalizedSymbol || 
        s.symbol.toLowerCase() === symbol.toLowerCase()
      );
    } catch (error) {
      console.log('Get Symbol Info Error:', error);
      return null;
    }
  }

  /**
   * Validate order parameters
   */
  validateOrder(symbolInfo, quantity, price, type) {
    const errors = [];
    
    if (!symbolInfo) {
      errors.push('Invalid symbol');
      return { valid: false, errors };
    }

    const qty = parseFloat(quantity);
    
    // For LIMIT orders, validate price-related fields
    if (type === 'LIMIT') {
      const prc = parseFloat(price);
      
      if (!price || isNaN(prc) || prc <= 0) {
        errors.push('Valid price is required for LIMIT orders');
        return { valid: false, errors };
      }
      
      const total = qty * prc;

      // Check minimum quantity
      if (symbolInfo.minQty && qty < parseFloat(symbolInfo.minQty)) {
        errors.push(`Quantity ${qty} is below minimum ${symbolInfo.minQty}`);
      }

      // Check minimum notional (minimum order value in quote currency)
      if (symbolInfo.minNotional && total < parseFloat(symbolInfo.minNotional)) {
        errors.push(`Order total ${total} is below minimum ${symbolInfo.minNotional}`);
      }

      // Check quantity precision
      if (symbolInfo.basePrecision) {
        const precision = parseInt(symbolInfo.basePrecision);
        const decimalPlaces = qty.toString().split('.')[1]?.length || 0;
        if (decimalPlaces > precision) {
          errors.push(`Quantity precision ${decimalPlaces} exceeds maximum ${precision}`);
        }
      }

      // Check price precision
      if (symbolInfo.pricePrecision) {
        const precision = parseInt(symbolInfo.pricePrecision);
        const decimalPlaces = prc.toString().split('.')[1]?.length || 0;
        if (decimalPlaces > precision) {
          errors.push(`Price precision ${decimalPlaces} exceeds maximum ${precision}`);
        }
      }
    } else if (type === 'MARKET') {
      // For MARKET orders, just validate amount/quantity
      if (symbolInfo.minNotional && qty < parseFloat(symbolInfo.minNotional)) {
        errors.push(`Order amount ${qty} is below minimum ${symbolInfo.minNotional}`);
      }
    }

    return { valid: errors.length === 0, errors, symbolInfo };
  }

  /**
   * Map XT error codes to human-readable messages
   */
  mapErrorCode(errorCode, params = []) {
    const errorMap = {
      'ORDER_008': 'Invalid order parameters or constraints violated',
      'ORDER_F0301': params.length > 0 
        ? `Insufficient balance. Exchange requires minimum ${params[0]} ${params[1]} to remain in account`
        : 'Insufficient balance',
      'ORDER_F0302': 'Order price out of range',
      'ORDER_F0303': 'Order quantity out of range',
      'ORDER_F0304': 'Order value too small',
      'ORDER_F0305': 'Order value too large',
    };

    return errorMap[errorCode] || errorCode;
  }

  /**
   * Check if user has sufficient balance for order
   */
  async checkBalance(quoteCurrency, requiredAmount, apiKey, secretKey) {
    try {
      const balanceResponse = await this.getBalance(apiKey, secretKey);
      if (!balanceResponse.success) {
        return { sufficient: false, available: 0, required: requiredAmount };
      }

      const balances = balanceResponse.data || [];
      const balance = balances.find(b => 
        b.currency.toLowerCase() === quoteCurrency.toLowerCase()
      );

      const available = parseFloat(balance?.availableAmount || balance?.available || 0);
      const required = parseFloat(requiredAmount);

      return {
        sufficient: available >= required,
        available: available,
        required: required,
        currency: quoteCurrency
      };
    } catch (error) {
      console.log('Balance Check Error:', error);
      return { sufficient: false, available: 0, required: requiredAmount };
    }
  }

  /**
   * Place a buy order
   */
  async placeBuyOrder(symbol, quantity, price = null, type = 'LIMIT', apiKey, secretKey) {
    try {
      console.log(`Placing BUY order: ${symbol}, qty: ${quantity}, price: ${price}, type: ${type}`);
      
      // Get symbol info for validation
      const symbolInfo = await this.getSymbolInfo(symbol, apiKey, secretKey);
      
      // Validate order
      const validation = this.validateOrder(symbolInfo, quantity, price, type);
      if (!validation.valid) {
        console.log('Order validation failed:', validation.errors);
        return {
          success: false,
          error: `Order validation failed: ${validation.errors.join(', ')}`,
          validationErrors: validation.errors,
          symbolInfo: symbolInfo ? {
            minQty: symbolInfo.minQty,
            minNotional: symbolInfo.minNotional,
            basePrecision: symbolInfo.basePrecision,
            pricePrecision: symbolInfo.pricePrecision
          } : null
        };
      }

      // Check balance for orders
      const quoteCurrency = symbol.split('_')[1] || 'usdt';
      let orderTotal;
      
      if (type.toUpperCase() === 'LIMIT' && price) {
        // For LIMIT orders: quantity = number of coins, need to calculate total
        orderTotal = parseFloat(quantity) * parseFloat(price);
      } else if (type.toUpperCase() === 'MARKET') {
        // For MARKET buy orders: quantity = amount of quote currency (USDT) to spend
        orderTotal = parseFloat(quantity);
      }
      
      if (orderTotal) {
        // Add minimum reserve requirement (exchanges typically require 1 USDT to remain)
        const minReserve = quoteCurrency.toLowerCase() === 'usdt' ? 1 : 0;
        const totalRequired = orderTotal + minReserve;
        
        const balanceCheck = await this.checkBalance(quoteCurrency, totalRequired, apiKey, secretKey);
        
        if (!balanceCheck.sufficient) {
          return {
            success: false,
            error: `Insufficient ${quoteCurrency.toUpperCase()} balance. Required: ${orderTotal} (+ ${minReserve} reserve) = ${totalRequired}, Available: ${balanceCheck.available}`,
            balanceCheck: {
              ...balanceCheck,
              orderAmount: orderTotal,
              reserve: minReserve
            }
          };
        }
      }

      const orderParams = {
        symbol: symbol.toLowerCase(),
        side: 'BUY',
        type: type.toUpperCase(),
        bizType: 'SPOT'
      };

      if (type.toUpperCase() === 'LIMIT') {
        // For LIMIT orders, use quantity and price
        orderParams.timeInForce = 'GTC';
        orderParams.quantity = quantity.toString();
        if (price) {
          orderParams.price = price.toString();
        }
      } else if (type.toUpperCase() === 'MARKET') {
        // For MARKET orders, use amount (total value in quote currency)
        // quantity parameter represents the amount of USDT to spend, not coins to buy
        orderParams.timeInForce = 'IOC'; // Immediate or Cancel - required by XT API for MARKET orders
        orderParams.amount = quantity.toString();
      }

      const response = await this.makeRequest(apiKey, secretKey, 'POST', '/v4/order', null, orderParams);
      
      console.log('XT Buy Order Response:', response);
      
      if (response.rc !== 0) {
        const errorMessage = this.mapErrorCode(response.mc, response.ma || []);
        return {
          success: false,
          error: errorMessage,
          errorCode: response.mc,
          code: response.rc,
          details: response
        };
      }

      return {
        success: true,
        data: response.result || response
      };
    } catch (error) {
      console.log('Buy Order Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to place buy order'
      };
    }
  }

  /**
   * Place a sell order
   */
  async placeSellOrder(symbol, quantity, price = null, type = 'LIMIT', apiKey, secretKey) {
    try {
      console.log(`Placing SELL order: ${symbol}, qty: ${quantity}, price: ${price}, type: ${type}`);
      
      // Get symbol info for validation
      const symbolInfo = await this.getSymbolInfo(symbol, apiKey, secretKey);
      
      // Validate order
      const validation = this.validateOrder(symbolInfo, quantity, price, type);
      if (!validation.valid) {
        console.log('Order validation failed:', validation.errors);
        return {
          success: false,
          error: `Order validation failed: ${validation.errors.join(', ')}`,
          validationErrors: validation.errors,
          symbolInfo: symbolInfo ? {
            minQty: symbolInfo.minQty,
            minNotional: symbolInfo.minNotional,
            basePrecision: symbolInfo.basePrecision,
            pricePrecision: symbolInfo.pricePrecision
          } : null
        };
      }

      // Check if user has sufficient base currency to sell
      const baseCurrency = symbol.split('_')[0] || 'btc';
      const balanceCheck = await this.checkBalance(baseCurrency, quantity, apiKey, secretKey);
      
      if (!balanceCheck.sufficient) {
        return {
          success: false,
          error: `Insufficient ${baseCurrency.toUpperCase()} balance. Required: ${balanceCheck.required}, Available: ${balanceCheck.available}`,
          balanceCheck: balanceCheck
        };
      }
      
      const orderParams = {
        symbol: symbol.toLowerCase(),
        side: 'SELL',
        type: type.toUpperCase(),
        bizType: 'SPOT'
      };

      if (type.toUpperCase() === 'LIMIT') {
        // For LIMIT orders, use quantity and price
        orderParams.timeInForce = 'GTC';
        orderParams.quantity = quantity.toString();
        if (price) {
          orderParams.price = price.toString();
        }
      } else if (type.toUpperCase() === 'MARKET') {
        // For MARKET sell orders, use quantity (amount of coins to sell)
        orderParams.timeInForce = 'IOC'; // Immediate or Cancel - required by XT API for MARKET orders
        orderParams.quantity = quantity.toString();
      }

      const response = await this.makeRequest(apiKey, secretKey, 'POST', '/v4/order', null, orderParams);
      
      console.log('XT Sell Order Response:', response);
      
      if (response.rc !== 0) {
        const errorMessage = this.mapErrorCode(response.mc, response.ma || []);
        return {
          success: false,
          error: errorMessage,
          errorCode: response.mc,
          code: response.rc,
          details: response
        };
      }

      return {
        success: true,
        data: response.result || response
      };
    } catch (error) {
      console.log('Sell Order Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to place sell order'
      };
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId, apiKey, secretKey) {
    try {
      console.log(`Canceling order: ${orderId}`);
      
      const response = await this.makeRequest(apiKey, secretKey, 'DELETE', '/v4/order', null, { orderId });
      
      console.log('XT Cancel Order Response:', response);
      
      if (response.rc !== 0) {
        return {
          success: false,
          error: response.mc || 'Failed to cancel order',
          code: response.rc
        };
      }

      return {
        success: true,
        data: response.result || response
      };
    } catch (error) {
      console.log('Cancel Order Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel order'
      };
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory(symbol = null, limit = 100, apiKey, secretKey) {
    try {
      const params = {};
      if (symbol) {
        params.symbol = symbol.toUpperCase();
      }

      console.log('Fetching order history:', params);
      
      const response = await this.makeRequest(apiKey, secretKey, 'GET', '/v4/open-orders', params);
      
      console.log('XT Order History Response:', response);
      
      if (response.rc !== 0) {
        return {
          success: false,
          error: response.mc || 'Failed to fetch order history',
          code: response.rc
        };
      }

      return {
        success: true,
        data: response.result || []
      };
    } catch (error) {
      console.log('Order History Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch order history'
      };
    }
  }

  /**
   * Get market ticker
   */
  async getTicker(symbol, apiKey, secretKey) {
    try {
      console.log(`Fetching ticker for: ${symbol}`);
      
      const response = await this.makeRequest(apiKey, secretKey, 'GET', '/v4/public/ticker', { symbol: symbol.toUpperCase() });
      
      console.log('XT Ticker Response:', response);
      
      if (response.rc !== 0) {
        return {
          success: false,
          error: response.mc || 'Failed to fetch ticker',
          code: response.rc
        };
      }

      return {
        success: true,
        data: response.result || response
      };
    } catch (error) {
      console.log('Ticker Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch ticker'
      };
    }
  }

  /**
   * Get all symbols
   */
  async getSymbols(apiKey, secretKey) {
    try {
      console.log('Fetching all symbols...');
      
      const response = await this.makeRequest(apiKey, secretKey, 'GET', '/v4/public/symbol');
      
      console.log('XT Symbols Response:', response);
      
      if (response.rc !== 0) {
        return {
          success: false,
          error: response.mc || 'Failed to fetch symbols',
          code: response.rc
        };
      }

      return {
        success: true,
        data: response.result || []
      };
    } catch (error) {
      console.log('Symbols Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch symbols'
      };
    }
  }

  /**
   * Get order book depth
   */
  async getDepth(symbol, limit = 20, apiKey, secretKey) {
    try {
      console.log(`Fetching depth for: ${symbol}`);
      
      const response = await this.makeRequest(apiKey, secretKey, 'GET', '/v4/public/depth', { 
        symbol: symbol.toUpperCase(), 
        limit 
      });
      
      console.log('XT Depth Response:', response);
      
      if (response.rc !== 0) {
        return {
          success: false,
          error: response.mc || 'Failed to fetch depth',
          code: response.rc
        };
      }

      return {
        success: true,
        data: response.result || response
      };
    } catch (error) {
      console.log('Depth Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch depth'
      };
    }
  }
}

export default new XTService();
