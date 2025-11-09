import { RestClientV2 } from 'bitget-api';

class BitgetService {
  constructor() {
    // We'll create client instances dynamically for each request
  }

  /**
   * Create Bitget client instance
   */
  createClient(apiKey, secretKey, passphrase) {
    return new RestClientV2({
      apiKey: apiKey,
      apiSecret: secretKey,
      apiPass: passphrase
    });
  }

  /**
   * Get account balance
   */
  async getBalance(apiKey, secretKey, passphrase) {
    try {
      console.log('Fetching balance from Bitget...');
      const client = this.createClient(apiKey, secretKey, passphrase);
      
      const response = await client.getSpotAccount();
      
      console.log('Bitget Balance Response:', response);
      
      if (response.code !== '00000') {
        return {
          success: false,
          error: response.msg || 'Failed to fetch balance',
          code: response.code,
          exchange: 'bitget'
        };
      }

      const balances = response.data || [];
      
      return {
        success: true,
        data: balances,
        exchange: 'bitget'
      };
    } catch (error) {
      console.log('Bitget Balance Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch balance',
        exchange: 'bitget'
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
        const frozen = parseFloat(balance.frozen || balance.lock || 0);
        const total = parseFloat(balance.available || 0) + frozen;

        if (total > 0) {
          portfolio.push({
            currency: balance.coin || balance.coinName,
            available: available,
            frozen: frozen,
            total: total,
            usdValue: parseFloat(balance.usdtValue || 0),
            exchange: 'bitget'
          });
        }
      }

      return {
        success: true,
        data: {
          portfolio,
          totalAssets: portfolio.length,
          exchange: 'bitget',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.log('Bitget Portfolio Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch portfolio',
        exchange: 'bitget'
      };
    }
  }

  /**
   * Place a buy order
   */
  async placeBuyOrder(symbol, quantity, price = null, type = 'LIMIT', apiKey, secretKey, passphrase) {
    try {
      console.log(`Placing BUY order on Bitget: ${symbol}, qty: ${quantity}, price: ${price}, type: ${type}`);
      
      const client = this.createClient(apiKey, secretKey, passphrase);

      const orderParams = {
        symbol: symbol.toUpperCase(),
        side: 'buy',
        orderType: type.toLowerCase(), // 'limit' or 'market'
        force: 'gtc', // Good Till Cancel
        size: quantity.toString()
      };

      if (type.toUpperCase() === 'LIMIT') {
        if (!price) {
          return {
            success: false,
            error: 'Price is required for LIMIT orders',
            exchange: 'bitget'
          };
        }
        orderParams.price = price.toString();
      }

      console.log('Bitget Order Params:', orderParams);
      
      const response = await client.spotSubmitOrder(orderParams);
      
      console.log('Bitget Buy Order Response:', response);
      
      if (response.code !== '00000') {
        return {
          success: false,
          error: response.msg || 'Failed to place buy order',
          code: response.code,
          exchange: 'bitget'
        };
      }

      return {
        success: true,
        data: response.data,
        exchange: 'bitget'
      };
    } catch (error) {
      console.log('Bitget Buy Order Error:', error);
      
      // Parse Bitget-specific errors
      let errorMessage = error.message || 'Failed to place buy order';
      let helpText = null;
      
      if (error.message?.includes('40007')) {
        errorMessage = 'Insufficient balance';
        helpText = 'Not enough funds in your spot account.';
      } else if (error.message?.includes('40008')) {
        errorMessage = 'Order size too small';
        helpText = 'Order value must meet minimum requirements.';
      } else if (error.message?.includes('40009')) {
        errorMessage = 'Invalid price';
        helpText = 'Price must be within allowed range.';
      }
      
      return {
        success: false,
        error: errorMessage,
        originalError: error.message,
        help: helpText,
        exchange: 'bitget'
      };
    }
  }

  /**
   * Place a sell order
   */
  async placeSellOrder(symbol, quantity, price = null, type = 'LIMIT', apiKey, secretKey, passphrase) {
    try {
      console.log(`Placing SELL order on Bitget: ${symbol}, qty: ${quantity}, price: ${price}, type: ${type}`);
      
      const client = this.createClient(apiKey, secretKey, passphrase);
      
      const orderParams = {
        symbol: symbol.toUpperCase(),
        side: 'sell',
        orderType: type.toLowerCase(),
        force: 'gtc',
        size: quantity.toString()
      };

      if (type.toUpperCase() === 'LIMIT') {
        if (!price) {
          return {
            success: false,
            error: 'Price is required for LIMIT orders',
            exchange: 'bitget'
          };
        }
        orderParams.price = price.toString();
      }

      console.log('Bitget Order Params:', orderParams);
      
      const response = await client.spotSubmitOrder(orderParams);
      
      console.log('Bitget Sell Order Response:', response);
      
      if (response.code !== '00000') {
        return {
          success: false,
          error: response.msg || 'Failed to place sell order',
          code: response.code,
          exchange: 'bitget'
        };
      }

      return {
        success: true,
        data: response.data,
        exchange: 'bitget'
      };
    } catch (error) {
      console.log('Bitget Sell Order Error:', error);
      
      // Parse Bitget-specific errors
      let errorMessage = error.message || 'Failed to place sell order';
      let helpText = null;
      
      if (error.message?.includes('40007')) {
        errorMessage = 'Insufficient balance';
        helpText = 'Not enough funds in your spot account.';
      } else if (error.message?.includes('40008')) {
        errorMessage = 'Order size too small';
        helpText = 'Order value must meet minimum requirements.';
      } else if (error.message?.includes('40009')) {
        errorMessage = 'Invalid price';
        helpText = 'Price must be within allowed range.';
      }
      
      return {
        success: false,
        error: errorMessage,
        originalError: error.message,
        help: helpText,
        exchange: 'bitget'
      };
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId, apiKey, secretKey, passphrase, symbol = null) {
    try {
      console.log(`Canceling Bitget order: ${orderId}`);
      
      const client = this.createClient(apiKey, secretKey, passphrase);
      
      const params = { orderId };
      if (symbol) {
        params.symbol = symbol.toUpperCase();
      }
      
      const response = await client.spotCancelOrder(params);
      
      console.log('Bitget Cancel Order Response:', response);
      
      if (response.code !== '00000') {
        return {
          success: false,
          error: response.msg || 'Failed to cancel order',
          code: response.code,
          exchange: 'bitget'
        };
      }

      return {
        success: true,
        data: response.data,
        exchange: 'bitget'
      };
    } catch (error) {
      console.log('Bitget Cancel Order Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel order',
        exchange: 'bitget'
      };
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory(symbol = null, limit = 100, apiKey, secretKey, passphrase) {
    try {
      console.log('Fetching Bitget order history:', { symbol, limit });
      
      const client = this.createClient(apiKey, secretKey, passphrase);
      
      const params = {
        limit: limit.toString()
      };
      
      if (symbol) {
        params.symbol = symbol.toUpperCase();
      }
      
      const response = await client.getSpotHistoricOrders(params);
      
      console.log('Bitget Order History Response:', response);
      
      if (response.code !== '00000') {
        return {
          success: false,
          error: response.msg || 'Failed to fetch order history',
          code: response.code,
          exchange: 'bitget'
        };
      }

      return {
        success: true,
        data: response.data || [],
        exchange: 'bitget'
      };
    } catch (error) {
      console.log('Bitget Order History Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch order history',
        exchange: 'bitget'
      };
    }
  }

  /**
   * Get market ticker
   */
  async getTicker(symbol, apiKey, secretKey, passphrase) {
    try {
      console.log(`Bitget: fetching ticker for ${symbol}`);
      const client = this.createClient(apiKey, secretKey, passphrase);
      
      const response = await client.getSpotTicker({ symbol: symbol.toUpperCase() });
      
      console.log('Bitget Ticker Response:', response);
      
      if (response.code !== '00000') {
        return {
          success: false,
          error: response.msg || 'Failed to fetch ticker',
          code: response.code,
          exchange: 'bitget'
        };
      }

      return {
        success: true,
        data: response.data,
        exchange: 'bitget'
      };
    } catch (error) {
      console.log('Bitget Ticker Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch ticker',
        exchange: 'bitget'
      };
    }
  }

  /**
   * Get symbols (trading pairs)
   */
  async getSymbols(apiKey, secretKey, passphrase) {
    try {
      console.log('Bitget: fetching symbols');
      const client = this.createClient(apiKey, secretKey, passphrase);
      
      const response = await client.getSpotSymbols();
      
      console.log('Bitget Symbols Response:', `${response.data?.length || 0} symbols`);
      
      if (response.code !== '00000') {
        return {
          success: false,
          error: response.msg || 'Failed to fetch symbols',
          code: response.code,
          exchange: 'bitget'
        };
      }

      return {
        success: true,
        data: response.data || [],
        exchange: 'bitget'
      };
    } catch (error) {
      console.log('Bitget Symbols Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch symbols',
        exchange: 'bitget'
      };
    }
  }

  /**
   * Get order book depth
   */
  async getDepth(symbol, limit = 20, apiKey, secretKey, passphrase) {
    try {
      console.log(`Bitget: fetching depth for ${symbol} (limit ${limit})`);
      const client = this.createClient(apiKey, secretKey, passphrase);
      
      const response = await client.getSpotOrderBook({
        symbol: symbol.toUpperCase(),
        type: 'step0',
        limit: limit.toString()
      });
      
      console.log('Bitget Depth Response:', response);
      
      if (response.code !== '00000') {
        return {
          success: false,
          error: response.msg || 'Failed to fetch depth',
          code: response.code,
          exchange: 'bitget'
        };
      }

      return {
        success: true,
        data: response.data,
        exchange: 'bitget'
      };
    } catch (error) {
      console.log('Bitget Depth Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch depth',
        exchange: 'bitget'
      };
    }
  }

  /**
   * Test connection to Bitget
   */
  async testConnection() {
    try {
      console.log('Testing Bitget connection...');
      
      const client = this.createClient('', '', ''); // Public endpoint
      
      const response = await client.getServerTime();
      
      return {
        success: true,
        message: 'Bitget connection successful',
        data: response.data,
        exchange: 'bitget'
      };
    } catch (error) {
      console.log('Bitget Connection Test Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to Bitget',
        exchange: 'bitget'
      };
    }
  }
}

export default new BitgetService();

