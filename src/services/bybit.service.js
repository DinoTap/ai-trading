import { RestClientV5 } from 'bybit-api';

class BybitService {
  constructor() {
    // We'll create client instances dynamically for each request
  }

  /**
   * Create Bybit client instance
   */
  createClient(apiKey, secretKey, useTestnet = false) {
    return new RestClientV5({
      testnet: useTestnet,
      key: apiKey,
      secret: secretKey,
    });
  }

  /**
   * Get account balance
   */
  async getBalance(apiKey, secretKey, accountType = 'UNIFIED') {
    try {
      console.log('Fetching balance from Bybit...');
      const client = this.createClient(apiKey, secretKey);
      
      const response = await client.getWalletBalance({
        accountType: accountType
      });
      
      console.log('Bybit Balance Response:', response);
      
      if (response.retCode !== 0) {
        return {
          success: false,
          error: response.retMsg || 'Failed to fetch balance',
          code: response.retCode
        };
      }

      const balanceData = response.result?.list || [];
      
      return {
        success: true,
        data: balanceData,
        exchange: 'bybit'
      };
    } catch (error) {
      console.error('Bybit Balance Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch balance',
        exchange: 'bybit'
      };
    }
  }

  /**
   * Get portfolio (all balances with current prices)
   */
  async getPortfolio(apiKey, secretKey, accountType = 'UNIFIED') {
    try {
      const balanceResponse = await this.getBalance(apiKey, secretKey, accountType);
      
      if (!balanceResponse.success) {
        return balanceResponse;
      }

      const balances = balanceResponse.data;
      const portfolio = [];

      // Process the balance data - it's an array of account objects
      for (const account of balances) {
        if (account.coin && Array.isArray(account.coin)) {
          // Process each coin in the account
          for (const coinData of account.coin) {
            const walletBalance = parseFloat(coinData.walletBalance || 0);
            const usdValue = parseFloat(coinData.usdValue || 0);
            const equity = parseFloat(coinData.equity || 0);
            const locked = parseFloat(coinData.locked || 0);
            const available = walletBalance - locked;

            if (walletBalance > 0 || usdValue > 0 || equity > 0) {
              portfolio.push({
                currency: coinData.coin,
                available: available,
                frozen: locked,
                total: walletBalance,
                usdValue: usdValue,
                equity: equity,
                exchange: 'bybit',
                accountType: account.accountType || accountType
              });
            }
          }
        }
      }

      return {
        success: true,
        data: {
          portfolio,
          totalAssets: portfolio.length,
          exchange: 'bybit',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Bybit Portfolio Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch portfolio',
        exchange: 'bybit'
      };
    }
  }

  /**
   * Place a buy order
   */
  async placeBuyOrder(symbol, quantity, price = null, type = 'LIMIT', apiKey, secretKey) {
    try {
      console.log(`Placing BUY order on Bybit: ${symbol}, qty: ${quantity}, price: ${price}, type: ${type}`);
      
      const client = this.createClient(apiKey, secretKey);

      const orderParams = {
        category: 'spot',
        symbol: symbol,
        side: 'Buy',
        orderType: type && type.toString().toUpperCase() === 'MARKET' ? 'Market' : 'Limit',
        qty: quantity.toString()
      };

      if ((type && type.toString().toUpperCase()) === 'LIMIT' && price) {
        orderParams.price = price.toString();
        orderParams.timeInForce = 'GTC';
      }

      // For spot MARKET BUY, Bybit often expects specifying marketUnit.
      if ((type && type.toString().toUpperCase()) === 'MARKET') {
        // Default to baseCoin to interpret qty as base amount. Adjust in client if needed.
        orderParams.marketUnit = 'baseCoin';
      }

      const response = await client.submitOrder(orderParams);
      
      console.log('Bybit Buy Order Response:', response);
      
      if (response.retCode !== 0) {
        return {
          success: false,
          error: response.retMsg || 'Failed to place buy order',
          errorCode: response.retCode,
          exchange: 'bybit'
        };
      }

      return {
        success: true,
        data: response.result,
        exchange: 'bybit'
      };
    } catch (error) {
      console.error('Bybit Buy Order Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to place buy order',
        exchange: 'bybit'
      };
    }
  }

  /**
   * Place a sell order
   */
  async placeSellOrder(symbol, quantity, price = null, type = 'LIMIT', apiKey, secretKey) {
    try {
      console.log(`Placing SELL order on Bybit: ${symbol}, qty: ${quantity}, price: ${price}, type: ${type}`);
      
      const client = this.createClient(apiKey, secretKey);
      
      const orderParams = {
        category: 'spot',
        symbol: symbol,
        side: 'Sell',
        orderType: type && type.toString().toUpperCase() === 'MARKET' ? 'Market' : 'Limit',
        qty: quantity.toString()
      };

      if ((type && type.toString().toUpperCase()) === 'LIMIT' && price) {
        orderParams.price = price.toString();
        orderParams.timeInForce = 'GTC';
      }

      const response = await client.submitOrder(orderParams);
      
      console.log('Bybit Sell Order Response:', response);
      
      if (response.retCode !== 0) {
        return {
          success: false,
          error: response.retMsg || 'Failed to place sell order',
          errorCode: response.retCode,
          exchange: 'bybit'
        };
      }

      return {
        success: true,
        data: response.result,
        exchange: 'bybit'
      };
    } catch (error) {
      console.error('Bybit Sell Order Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to place sell order',
        exchange: 'bybit'
      };
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId, apiKey, secretKey) {
    try {
      console.log(`Canceling Bybit order: ${orderId}`);
      
      const client = this.createClient(apiKey, secretKey);
      
      const response = await client.cancelOrder({
        category: 'spot',
        orderId: orderId 
      });
      
      console.log('Bybit Cancel Order Response:', response);
      
      if (response.retCode !== 0) {
        return {
          success: false,
          error: response.retMsg || 'Failed to cancel order',
          errorCode: response.retCode,
          exchange: 'bybit'
        };
      }

      return {
        success: true,
        data: response.result,
        exchange: 'bybit'
      };
    } catch (error) {
      console.error('Bybit Cancel Order Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel order',
        exchange: 'bybit'
      };
    }
  }

  /**
   * Test connection to Bybit
   */
  async testConnection() {
    try {
      console.log('Testing Bybit connection...');
      
      // Use a dummy client to test connection
      const client = this.createClient('test', 'test');
      
      // Try to get server time (no auth required)
      const response = await client.getServerTime();
      
      return {
        success: true,
        message: 'Bybit connection successful',
        data: response,
        exchange: 'bybit'
      };
    } catch (error) {
      console.error('Bybit Connection Test Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to Bybit',
        exchange: 'bybit'
      };
    }
  }
}

export default new BybitService();