import axios from 'axios';

// System prompt for ChainGPT with real-time focus
const CHAINGPT_SYSTEM_PROMPT = `You are ChainGPT, an advanced AI assistant specialized in cryptocurrency and blockchain with real-time market data access. Your capabilities include:

- Real-time cryptocurrency prices, market cap, and trading volumes
- Live market sentiment analysis and trend detection
- On-chain data analysis and blockchain metrics
- Technical analysis with current price action
- Real-time news and events affecting crypto markets
- Current DeFi protocols TVL and activity
- Live gas fees and network congestion data

IMPORTANT:
1. Provide CURRENT, REAL-TIME information whenever possible
2. Include specific prices, percentages, and numbers when discussing markets
3. Focus on actionable, time-sensitive insights
4. Warn users that crypto markets are volatile and change rapidly
5. Always mention the timestamp or "current" status of data
6. For trading decisions, emphasize real-time factors

RESPONSE STYLE:
- Start with current market data when relevant
- Include specific numbers and percentages
- Highlight time-sensitive opportunities or risks
- Be concise but data-rich
- Use real-time context in your analysis`;

class ChainGPTService {
  constructor() {
    // Hardcoded ChainGPT API key
    this.apiKey = 'b1182465-cfe4-46ee-9d6c-e2972941b884';
    this.baseUrl = 'https://api.chaingpt.org/api/v1';
    this.model = 'gpt-4-turbo'; // ChainGPT's model
    
    console.log('✅ ChainGPT AI service initialized with real-time capabilities');
  }

  async sendMessage(message) {
    if (!this.apiKey) {
      throw new Error('ChainGPT API key not configured');
    }

    try {
      console.log('Sending message to ChainGPT API for real-time analysis...');
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: CHAINGPT_SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data?.choices?.[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('No response from ChainGPT API');
      }

      console.log('✅ Got real-time response from ChainGPT');
      return aiResponse;
      
    } catch (error) {
      console.error('Error sending message to ChainGPT:', error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('ChainGPT API key is invalid or unauthorized');
      }
      
      if (error.response?.status === 429) {
        throw new Error('ChainGPT API rate limit exceeded. Please try again later.');
      }
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error?.message || 'Bad request';
        throw new Error(`ChainGPT API Error: ${errorMessage}`);
      }
      
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to get response from ChainGPT');
    }
  }

  async getRealTimePrice(symbol) {
    try {
      console.log(`Fetching real-time price for ${symbol}...`);
      
      // ChainGPT's real-time price endpoint
      const response = await axios.get(
        `${this.baseUrl}/crypto/price/${symbol.toUpperCase()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
      
    } catch (error) {
      console.error('Error fetching real-time price:', error.response?.data || error.message);
      throw new Error(`Failed to fetch real-time price for ${symbol}`);
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

