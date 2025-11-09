import Binance from 'binance-api-node';

class BinanceService {
  constructor() {
    // We'll create client instances dynamically for each request
  }

  /**
   * Create Binance client instance
   */
  createClient(apiKey, secretKey) {
    // binance-api-node exports as default, but may need .default in ES modules
    const BinanceClient = Binance.default || Binance;
    return BinanceClient({
      apiKey: apiKey,
      apiSecret: secretKey,
      // Use mainnet (no testnet flag)
    });
  }

  /**
   * Get account balance
   */
  async getBalance(apiKey, secretKey) {
    try {
      console.log('Fetching balance from Binance...');
      const client = this.createClient(apiKey, secretKey);
      
      const accountInfo = await client.accountInfo();
      
      console.log('Binance Balance Response:', accountInfo);
      
      // Filter out zero balances
      const balances = accountInfo.balances.filter(b => 
        parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
      );
      
      return {
        success: true,
        data: balances,
        exchange: 'binance'
      };
    } catch (error) {
      console.log('Binance Balance Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch balance',
        exchange: 'binance'
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

      // Get current prices for all assets
      const prices = await this.getAllPrices();

      for (const balance of balances) {
        const free = parseFloat(balance.free || 0);
        const locked = parseFloat(balance.locked || 0);
        const total = free + locked;

        if (total > 0) {
          // Try to get USD value
          let usdValue = 0;
          const symbol = `${balance.asset}USDT`;
          if (prices[symbol]) {
            usdValue = total * parseFloat(prices[symbol]);
          }

          portfolio.push({
            currency: balance.asset,
            available: free,
            frozen: locked,
            total: total,
            usdValue: usdValue,
            exchange: 'binance'
          });
        }
      }

      return {
        success: true,
        data: {
          portfolio,
          totalAssets: portfolio.length,
          exchange: 'binance',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.log('Binance Portfolio Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch portfolio',
        exchange: 'binance'
      };
    }
  }

  /**
   * Get all current prices (helper method)
   */
  async getAllPrices() {
    try {
      const client = this.createClient('', ''); // Public endpoint, no auth needed
      const prices = await client.prices();
      return prices;
    } catch (error) {
      console.log('Failed to fetch prices:', error);
      return {};
    }
  }

  /**
   * Place a buy order
   */
  async placeBuyOrder(symbol, quantity, price = null, type = 'LIMIT', apiKey, secretKey) {
    try {
      console.log(`Placing BUY order on Binance: ${symbol}, qty: ${quantity}, price: ${price}, type: ${type}`);
      
      const client = this.createClient(apiKey, secretKey);

      const orderParams = {
        symbol: symbol.toUpperCase(),
        side: 'BUY',
        type: type.toUpperCase(),
        quantity: quantity.toString()
      };

      if (type.toUpperCase() === 'LIMIT') {
        if (!price) {
          return {
            success: false,
            error: 'Price is required for LIMIT orders',
            exchange: 'binance'
          };
        }
        orderParams.price = price.toString();
        orderParams.timeInForce = 'GTC'; // Good Till Cancel
      }

      console.log('Binance Order Params:', orderParams);
      
      const response = await client.order(orderParams);
      
      console.log('Binance Buy Order Response:', response);
      
      return {
        success: true,
        data: response,
        exchange: 'binance'
      };
    } catch (error) {
      console.log('Binance Buy Order Error:', error);
      
      // Parse Binance-specific errors
      let errorMessage = error.message || 'Failed to place buy order';
      let helpText = null;
      
      if (error.message?.includes('NOTIONAL')) {
        errorMessage = 'Order value too small';
        helpText = 'Binance requires minimum $10 USD order value. Increase quantity or price.';
      } else if (error.message?.includes('LOT_SIZE')) {
        errorMessage = 'Invalid quantity';
        helpText = 'Quantity must meet symbol\'s minimum/maximum/step size requirements.';
      } else if (error.message?.includes('PRICE_FILTER')) {
        errorMessage = 'Invalid price';
        helpText = 'Price must meet symbol\'s minimum/maximum/tick size requirements.';
      } else if (error.message?.includes('MIN_NOTIONAL')) {
        errorMessage = 'Order value too small';
        helpText = 'Order value must be at least $10 USD.';
      } else if (error.message?.includes('INSUFFICIENT')) {
        errorMessage = 'Insufficient balance';
        helpText = 'Not enough funds in your account.';
      }
      
      return {
        success: false,
        error: errorMessage,
        originalError: error.message,
        help: helpText,
        details: error.body || null,
        exchange: 'binance'
      };
    }
  }

  /**
   * Place a sell order
   */
  async placeSellOrder(symbol, quantity, price = null, type = 'LIMIT', apiKey, secretKey) {
    try {
      console.log(`Placing SELL order on Binance: ${symbol}, qty: ${quantity}, price: ${price}, type: ${type}`);
      
      const client = this.createClient(apiKey, secretKey);
      
      const orderParams = {
        symbol: symbol.toUpperCase(),
        side: 'SELL',
        type: type.toUpperCase(),
        quantity: quantity.toString()
      };

      if (type.toUpperCase() === 'LIMIT') {
        if (!price) {
          return {
            success: false,
            error: 'Price is required for LIMIT orders',
            exchange: 'binance'
          };
        }
        orderParams.price = price.toString();
        orderParams.timeInForce = 'GTC';
      }

      console.log('Binance Order Params:', orderParams);
      
      const response = await client.order(orderParams);
      
      console.log('Binance Sell Order Response:', response);
      
      return {
        success: true,
        data: response,
        exchange: 'binance'
      };
    } catch (error) {
      console.log('Binance Sell Order Error:', error);
      
      // Parse Binance-specific errors
      let errorMessage = error.message || 'Failed to place sell order';
      let helpText = null;
      
      if (error.message?.includes('NOTIONAL')) {
        errorMessage = 'Order value too small';
        helpText = 'Binance requires minimum $10 USD order value. Increase quantity or price.';
      } else if (error.message?.includes('LOT_SIZE')) {
        errorMessage = 'Invalid quantity';
        helpText = 'Quantity must meet symbol\'s minimum/maximum/step size requirements.';
      } else if (error.message?.includes('PRICE_FILTER')) {
        errorMessage = 'Invalid price';
        helpText = 'Price must meet symbol\'s minimum/maximum/tick size requirements.';
      } else if (error.message?.includes('MIN_NOTIONAL')) {
        errorMessage = 'Order value too small';
        helpText = 'Order value must be at least $10 USD.';
      } else if (error.message?.includes('INSUFFICIENT')) {
        errorMessage = 'Insufficient balance';
        helpText = 'Not enough funds in your account.';
      }
      
      return {
        success: false,
        error: errorMessage,
        originalError: error.message,
        help: helpText,
        details: error.body || null,
        exchange: 'binance'
      };
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId, apiKey, secretKey, symbol = null) {
    try {
      console.log(`Canceling Binance order: ${orderId}`);
      
      const client = this.createClient(apiKey, secretKey);
      
      const params = { orderId: orderId };
      if (symbol) {
        params.symbol = symbol.toUpperCase();
      }
      
      const response = await client.cancelOrder(params);
      
      console.log('Binance Cancel Order Response:', response);
      
      return {
        success: true,
        data: response,
        exchange: 'binance'
      };
    } catch (error) {
      console.log('Binance Cancel Order Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel order',
        exchange: 'binance'
      };
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory(symbol = null, limit = 100, apiKey, secretKey) {
    try {
      console.log('Fetching Binance order history:', { symbol, limit });
      
      const client = this.createClient(apiKey, secretKey);
      
      let orders;
      if (symbol) {
        // Get orders for specific symbol
        orders = await client.allOrders({
          symbol: symbol.toUpperCase(),
          limit: limit
        });
      } else {
        // Get open orders for all symbols
        orders = await client.openOrders();
      }
      
      console.log('Binance Order History Response:', orders);
      
      return {
        success: true,
        data: orders || [],
        exchange: 'binance'
      };
    } catch (error) {
      console.log('Binance Order History Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch order history',
        exchange: 'binance'
      };
    }
  }

  /**
   * Get market ticker
   */
  async getTicker(symbol, apiKey, secretKey) {
    try {
      console.log(`Binance: fetching ticker for ${symbol}`);
      const client = this.createClient(apiKey, secretKey);
      
      const ticker = await client.dailyStats({ symbol: symbol.toUpperCase() });
      
      console.log('Binance Ticker Response:', ticker);
      
      return {
        success: true,
        data: ticker,
        exchange: 'binance'
      };
    } catch (error) {
      console.log('Binance Ticker Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch ticker',
        exchange: 'binance'
      };
    }
  }

  /**
   * Get symbols (exchange info)
   */
  async getSymbols(apiKey, secretKey) {
    try {
      console.log('Binance: fetching symbols (exchange info)');
      const client = this.createClient(apiKey, secretKey);
      
      const exchangeInfo = await client.exchangeInfo();
      
      console.log('Binance Symbols Response:', `${exchangeInfo.symbols.length} symbols`);
      
      return {
        success: true,
        data: {
          symbols: exchangeInfo.symbols,
          timezone: exchangeInfo.timezone,
          serverTime: exchangeInfo.serverTime
        },
        exchange: 'binance'
      };
    } catch (error) {
      console.log('Binance Symbols Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch symbols',
        exchange: 'binance'
      };
    }
  }

  /**
   * Get order book depth
   */
  async getDepth(symbol, limit = 20, apiKey, secretKey) {
    try {
      console.log(`Binance: fetching depth for ${symbol} (limit ${limit})`);
      const client = this.createClient(apiKey, secretKey);
      
      const depth = await client.book({ 
        symbol: symbol.toUpperCase(), 
        limit: limit 
      });
      
      console.log('Binance Depth Response:', depth);
      
      return {
        success: true,
        data: depth,
        exchange: 'binance'
      };
    } catch (error) {
      console.log('Binance Depth Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch depth',
        exchange: 'binance'
      };
    }
  }

  /**
   * Test connection to Binance
   */
  async testConnection() {
    try {
      console.log('Testing Binance connection...');
      
      const client = this.createClient('', ''); // Public endpoint
      
      const time = await client.time();
      const ping = await client.ping();
      
      return {
        success: true,
        message: 'Binance connection successful',
        data: { serverTime: time, ping },
        exchange: 'binance'
      };
    } catch (error) {
      console.log('Binance Connection Test Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to Binance',
        exchange: 'binance'
      };
    }
  }
}

export default new BinanceService();

