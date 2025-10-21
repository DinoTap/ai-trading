import axios from 'axios';

// System prompt to restrict AI to crypto and blockchain topics
const CRYPTO_SYSTEM_PROMPT = `You are an expert AI Trading Assistant specializing EXCLUSIVELY in cryptocurrency and blockchain technology. Your expertise includes:

- Cryptocurrency trading strategies, technical analysis, and market trends
- Blockchain technology, DeFi, NFTs, and Web3 concepts
- Major cryptocurrencies (Bitcoin, Ethereum, Solana, etc.) and altcoins
- Trading pairs, order types, and exchange mechanics
- Risk management and portfolio diversification in crypto
- Market sentiment analysis and on-chain metrics
- Crypto regulations and compliance

IMPORTANT RESTRICTIONS:
1. ONLY discuss topics related to cryptocurrency, blockchain, and digital assets
2. If asked about non-crypto topics, politely redirect the conversation back to crypto/blockchain
3. Do NOT provide information about stocks, forex, commodities, or traditional finance unless directly comparing to crypto
4. Always prioritize user safety - warn about risks and never guarantee profits
5. Keep responses concise, actionable, and trading-focused

RESPONSE STYLE:
- Be professional yet friendly
- Use crypto trading terminology appropriately
- Provide specific, actionable insights when possible
- Include relevant market context
- Keep responses under 200 words unless detailed analysis is requested

If a user asks about something unrelated to crypto/blockchain, respond with:
"I'm specialized in cryptocurrency and blockchain topics. I can help you with crypto trading strategies, market analysis, portfolio management, or blockchain technology questions. How can I assist you with your crypto journey?"`;

class GeminiService {
  constructor() {
    // Hardcoded API key
    this.apiKey = 'AIzaSyCUpZV0Yy3yBehc6Ts3jIJvKWDawkZWXzQ';
    this.model = 'gemini-2.0-flash';
    this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    
    console.log('✅ Gemini AI service initialized with gemini-2.0-flash');
  }

  async sendMessage(message) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Combine system prompt with user message
      const fullMessage = `${CRYPTO_SYSTEM_PROMPT}

User Question: ${message}

Assistant (respond as a crypto/blockchain expert only):`;

      console.log('Sending message to Gemini API...');
      
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [{ 
                text: fullMessage
              }],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Extract the response text
      const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiResponse) {
        throw new Error('No response from Gemini API');
      }

      console.log('✅ Got response from Gemini');
      return aiResponse;
      
    } catch (error) {
      console.error('Error sending message to Gemini:', error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error?.message || 'Bad request';
        throw new Error(`Gemini API Error: ${errorMessage}`);
      }
      
      if (error.response?.status === 403) {
        throw new Error('API key is invalid or does not have permission to use this model');
      }
      
      if (error.response?.status === 429) {
        throw new Error('API quota exceeded. Please try again later.');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Gemini model not found. The model name might be incorrect.');
      }
      
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to get response from AI');
    }
  }

  isConfigured() {
    const configured = !!this.apiKey;
    console.log(`Gemini configured: ${configured}`);
    return configured;
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
