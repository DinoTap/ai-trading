import { GeneralChat } from '@chaingpt/generalchat';

class ChainGPTService {
  constructor() {
    // Hardcoded ChainGPT API key
    this.apiKey = 'b1182465-cfe4-46ee-9d6c-e2972941b884';
    
    // Initialize ChainGPT SDK
    this.generalchat = new GeneralChat({
      apiKey: this.apiKey
    });
    
    console.log('✅ ChainGPT AI service initialized with real-time capabilities (using official SDK)');
  }

  async sendMessage(message) {
    if (!this.apiKey) {
      throw new Error('ChainGPT API key not configured');
    }

    try {
      console.log('Sending message to ChainGPT API for real-time analysis...');
      
      // Use the official SDK method
      const response = await this.generalchat.createChatBlob({
        question: message,
        chatHistory: 'off'  // Disable chat history for stateless requests
      });

      // Extract the bot's response
      const aiResponse = response?.data?.bot;
      
      if (!aiResponse) {
        console.error('No bot message in response:', response);
        throw new Error('No response from ChainGPT API');
      }

      console.log('✅ Got real-time response from ChainGPT');
      return aiResponse;
      
    } catch (error) {
      console.error('Error sending message to ChainGPT:', error.message);
      
      // Handle specific error cases
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        throw new Error('ChainGPT API key is invalid or unauthorized');
      }
      
      if (error.message?.includes('402') || error.message?.includes('403') || error.message?.includes('credits')) {
        throw new Error('Insufficient ChainGPT credits. Please top up your account at https://app.chaingpt.org/');
      }
      
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        throw new Error('ChainGPT API rate limit exceeded. Please try again later.');
      }
      
      throw new Error(error.message || 'Failed to get response from ChainGPT');
    }
  }

  async getRealTimePrice(symbol) {
    try {
      console.log(`Fetching real-time price for ${symbol} using ChainGPT...`);
      
      // Use ChainGPT chat to get real-time price information
      const message = `What is the current real-time price of ${symbol.toUpperCase()}? Provide the exact current price, 24h change percentage, and market cap. Be concise and specific with numbers.`;
      
      const response = await this.sendMessage(message);
      
      return {
        symbol: symbol.toUpperCase(),
        analysis: response,
        source: 'ChainGPT AI with real-time data'
      };
      
    } catch (error) {
      console.error('Error fetching real-time price:', error.message);
      throw new Error(`Failed to fetch real-time price for ${symbol}: ${error.message}`);
    }
  }

  async getMarketAnalysis(symbol) {
    try {
      console.log(`Getting real-time market analysis for ${symbol}...`);
      
      const message = `Provide a detailed real-time market analysis for ${symbol}. Include:
      1. Current price and 24h change
      2. Key support and resistance levels
      3. Current market sentiment
      4. Short-term price prediction (next 24-48 hours)
      5. Important factors affecting the price right now`;
      
      return await this.sendMessage(message);
      
    } catch (error) {
      console.error('Error getting market analysis:', error.message);
      throw error;
    }
  }

  isConfigured() {
    const configured = !!this.apiKey;
    console.log(`ChainGPT configured: ${configured}`);
    return configured;
  }
}

// Export singleton instance
export const chainGPTService = new ChainGPTService();

