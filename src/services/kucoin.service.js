import kucoin from 'kucoin-node-sdk';

class KucoinService {
  constructor() {
    // We'll create client instances dynamically for each request
  }

  /**
   * Initialize KuCoin client
   */
  initClient(apiKey, secretKey, passphrase) {
    kucoin.init({
      baseUrl: 'https://api.kucoin.com',
      apiAuth: {
        key: apiKey,
        secret: secretKey,
        passphrase: passphrase
      },
      authVersion: 2 // KC-API-KEY-VERSION. Notice: for v2 API-KEY, not required for v1 version.
    });
  }

  /**
   * Get account balance
   */
  async getBalance(apiKey, secretKey, passphrase) {
    try {
      console.log('Fetching balance from KuCoin...');
      this.initClient(apiKey, secretKey, passphrase);
      
      const response = await kucoin.rest.User.Account.getAccountsList();
      
      console.log('KuCoin Balance Response:', response);
      
      if (response.code !== '200000') {
        return {
          success: false,
          error: response.msg || 'Failed to fetch balance',
          code: response.code,
          exchange: 'kucoin'
        };
      }

      const balances = response.data || [];
      
      return {
        success: true,
        data: balances,
        exchange: 'kucoin'
      };
    } catch (error) {
      console.log('KuCoin Balance Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch balance',
        exchange: 'kucoin'
      };
    }
  }

  /**
   * Get portfolio (all balances with current prices)
   */
  async getPortfolio(apiKey, secretKey, passphrase) {
    try {
      const balanceResponse = await this.getBalance(apiKey, secretKey, passphrase);
      
      if (!balanceResponse.success) {
        return balanceResponse;
      }

      const balances = balanceResponse.data;
      const portfolio = [];

      for (const balance of balances) {
        const available = parseFloat(balance.available || 0);
        const holds = parseFloat(balance.holds || 0);
        const total = parseFloat(balance.balance || 0);

        if (total > 0) {
          portfolio.push({
            currency: balance.currency,
            available: available,
            frozen: holds,
            total: total,
            type: balance.type, // 'main', 'trade', 'margin'
            exchange: 'kucoin'
          });
        }
      }

      return {
        success: true,
        data: {
          portfolio,
          totalAssets: portfolio.length,
          exchange: 'kucoin',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.log('KuCoin Portfolio Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch portfolio',
        exchange: 'kucoin'
      };
    }
  }

  /**
   * Place a buy order
   */
  async placeBuyOrder(symbol, quantity, price = null, type = 'LIMIT', apiKey, secretKey, passphrase) {
    try {
      console.log(`Placing BUY order on KuCoin: ${symbol}, qty: ${quantity}, price: ${price}, type: ${type}`);
      
      this.initClient(apiKey, secretKey, passphrase);

      const orderParams = {
        clientOid: Date.now().toString(), // Unique order id
        side: 'buy',
        symbol: symbol.toUpperCase(),
        type: type.toLowerCase() // 'limit' or 'market'
      };

      if (type.toUpperCase() === 'LIMIT') {
        if (!price) {
          return {
            success: false,
            error: 'Price is required for LIMIT orders',
            exchange: 'kucoin'
          };
        }
        orderParams.price = price.toString();
        orderParams.size = quantity.toString();
      } else if (type.toUpperCase() === 'MARKET') {
        // For market orders, can use 'size' (base currency) or 'funds' (quote currency)
        orderParams.size = quantity.toString();
      }

      console.log('KuCoin Order Params:', orderParams);
      
      const response = await kucoin.rest.Trade.Orders.postOrder(orderParams);
      
      console.log('KuCoin Buy Order Response:', response);
      
      if (response.code !== '200000') {
        return {
          success: false,
          error: response.msg || 'Failed to place buy order',
          code: response.code,
          exchange: 'kucoin'
        };
      }

      return {
        success: true,
        data: response.data,
        exchange: 'kucoin'
      };
    } catch (error) {
      console.log('KuCoin Buy Order Error:', error);
      
      // Parse KuCoin-specific errors
      let errorMessage = error.message || 'Failed to place buy order';
      let helpText = null;
      
      if (error.message?.includes('400100')) {
        errorMessage = 'Invalid parameters';
        helpText = 'Check symbol format, quantity, and price values.';
      } else if (error.message?.includes('200004')) {
        errorMessage = 'Insufficient balance';
        helpText = 'Not enough funds in your trading account.';
      } else if (error.message?.includes('400350')) {
        errorMessage = 'Order size too small';
        helpText = 'Order value must meet minimum requirements (usually $1).';
      }
      
      return {
        success: false,
        error: errorMessage,
        originalError: error.message,
        help: helpText,
        exchange: 'kucoin'
      };
    }
  }

  /**
   * Place a sell order
   */
  async placeSellOrder(symbol, quantity, price = null, type = 'LIMIT', apiKey, secretKey, passphrase) {
    try {
      console.log(`Placing SELL order on KuCoin: ${symbol}, qty: ${quantity}, price: ${price}, type: ${type}`);
      
      this.initClient(apiKey, secretKey, passphrase);
      
      const orderParams = {
        clientOid: Date.now().toString(),
        side: 'sell',
        symbol: symbol.toUpperCase(),
        type: type.toLowerCase()
      };

      if (type.toUpperCase() === 'LIMIT') {
        if (!price) {
          return {
            success: false,
            error: 'Price is required for LIMIT orders',
            exchange: 'kucoin'
          };
        }
        orderParams.price = price.toString();
        orderParams.size = quantity.toString();
      } else if (type.toUpperCase() === 'MARKET') {
        orderParams.size = quantity.toString();
      }

      console.log('KuCoin Order Params:', orderParams);
      
      const response = await kucoin.rest.Trade.Orders.postOrder(orderParams);
      
      console.log('KuCoin Sell Order Response:', response);
      
      if (response.code !== '200000') {
        return {
          success: false,
          error: response.msg || 'Failed to place sell order',
          code: response.code,
          exchange: 'kucoin'
        };
      }

      return {
        success: true,
        data: response.data,
        exchange: 'kucoin'
      };
    } catch (error) {
      console.log('KuCoin Sell Order Error:', error);
      
      // Parse KuCoin-specific errors
      let errorMessage = error.message || 'Failed to place sell order';
      let helpText = null;
      
      if (error.message?.includes('400100')) {
        errorMessage = 'Invalid parameters';
        helpText = 'Check symbol format, quantity, and price values.';
      } else if (error.message?.includes('200004')) {
        errorMessage = 'Insufficient balance';
        helpText = 'Not enough funds in your trading account.';
      } else if (error.message?.includes('400350')) {
        errorMessage = 'Order size too small';
        helpText = 'Order value must meet minimum requirements (usually $1).';
      }
      
      return {
        success: false,
        error: errorMessage,
        originalError: error.message,
        help: helpText,
        exchange: 'kucoin'
      };
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId, apiKey, secretKey, passphrase) {
    try {
      console.log(`Canceling KuCoin order: ${orderId}`);
      
      this.initClient(apiKey, secretKey, passphrase);
      
      const response = await kucoin.rest.Trade.Orders.cancelOrderById({ orderId });
      
      console.log('KuCoin Cancel Order Response:', response);
      
      if (response.code !== '200000') {
        return {
          success: false,
          error: response.msg || 'Failed to cancel order',
          code: response.code,
          exchange: 'kucoin'
        };
      }

      return {
        success: true,
        data: response.data,
        exchange: 'kucoin'
      };
    } catch (error) {
      console.log('KuCoin Cancel Order Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel order',
        exchange: 'kucoin'
      };
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory(symbol = null, limit = 100, apiKey, secretKey, passphrase) {
    try {
      console.log('Fetching KuCoin order history:', { symbol, limit });
      
      this.initClient(apiKey, secretKey, passphrase);
      
      const params = {
        status: 'done', // 'active' or 'done'
        pageSize: limit
      };
      
      if (symbol) {
        params.symbol = symbol.toUpperCase();
      }
      
      const response = await kucoin.rest.Trade.Orders.getOrdersList(params);
      
      console.log('KuCoin Order History Response:', response);
      
      if (response.code !== '200000') {
        return {
          success: false,
          error: response.msg || 'Failed to fetch order history',
          code: response.code,
          exchange: 'kucoin'
        };
      }

      return {
        success: true,
        data: response.data?.items || [],
        exchange: 'kucoin'
      };
    } catch (error) {
      console.log('KuCoin Order History Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch order history',
        exchange: 'kucoin'
      };
    }
  }

  /**
   * Get market ticker
   */
  async getTicker(symbol, apiKey, secretKey, passphrase) {
    try {
      console.log(`KuCoin: fetching ticker for ${symbol}`);
      this.initClient(apiKey, secretKey, passphrase);
      
      const response = await kucoin.rest.Market.Symbols.get24hrStats({ symbol: symbol.toUpperCase() });
      
      console.log('KuCoin Ticker Response:', response);
      
      if (response.code !== '200000') {
        return {
          success: false,
          error: response.msg || 'Failed to fetch ticker',
          code: response.code,
          exchange: 'kucoin'
        };
      }

      return {
        success: true,
        data: response.data,
        exchange: 'kucoin'
      };
    } catch (error) {
      console.log('KuCoin Ticker Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch ticker',
        exchange: 'kucoin'
      };
    }
  }

  /**
   * Get symbols (trading pairs)
   */
  async getSymbols(apiKey, secretKey, passphrase) {
    try {
      console.log('KuCoin: fetching symbols');
      this.initClient(apiKey, secretKey, passphrase);
      
      const response = await kucoin.rest.Market.Symbols.getSymbolsList();
      
      console.log('KuCoin Symbols Response:', `${response.data?.length || 0} symbols`);
      
      if (response.code !== '200000') {
        return {
          success: false,
          error: response.msg || 'Failed to fetch symbols',
          code: response.code,
          exchange: 'kucoin'
        };
      }

      return {
        success: true,
        data: response.data || [],
        exchange: 'kucoin'
      };
    } catch (error) {
      console.log('KuCoin Symbols Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch symbols',
        exchange: 'kucoin'
      };
    }
  }

  /**
   * Get order book depth
   */
  async getDepth(symbol, limit = 20, apiKey, secretKey, passphrase) {
    try {
      console.log(`KuCoin: fetching depth for ${symbol} (limit ${limit})`);
      this.initClient(apiKey, secretKey, passphrase);
      
      const response = await kucoin.rest.Market.OrderBook.getLevel2({ symbol: symbol.toUpperCase() });
      
      console.log('KuCoin Depth Response:', response);
      
      if (response.code !== '200000') {
        return {
          success: false,
          error: response.msg || 'Failed to fetch depth',
          code: response.code,
          exchange: 'kucoin'
        };
      }

      // Limit the results
      const data = response.data || {};
      if (data.bids) data.bids = data.bids.slice(0, limit);
      if (data.asks) data.asks = data.asks.slice(0, limit);

      return {
        success: true,
        data: data,
        exchange: 'kucoin'
      };
    } catch (error) {
      console.log('KuCoin Depth Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch depth',
        exchange: 'kucoin'
      };
    }
  }

  /**
   * Test connection to KuCoin
   */
  async testConnection() {
    try {
      console.log('Testing KuCoin connection...');
      
      const response = await kucoin.rest.Others.getTimestamp();
      
      return {
        success: true,
        message: 'KuCoin connection successful',
        data: response.data,
        exchange: 'kucoin'
      };
    } catch (error) {
      console.log('KuCoin Connection Test Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to KuCoin',
        exchange: 'kucoin'
      };
    }
  }
}

export default new KucoinService();

