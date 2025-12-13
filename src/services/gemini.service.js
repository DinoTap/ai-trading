import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

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
    // Use environment variable or fallback to hardcoded key
    this.apiKey = process.env.GEMINI_API_KEY || 'AIzaSyAeRCdXR_0Ev5YnXJzBESC2dc6tc1S8Uuo';
    this.model = 'gemini-2.5-flash';
    
    // Initialize GoogleGenAI client - it reads API key from GEMINI_API_KEY env var automatically
    // If not in env, we'll set it via apiKey option
    this.ai = new GoogleGenAI({
      apiKey: this.apiKey
    });
    
    console.log('✅ Gemini AI service initialized with gemini-2.5-flash');
    if (process.env.GEMINI_API_KEY) {
      console.log('✅ Using Gemini API key from environment variable');
    } else {
      console.log('⚠️  Using hardcoded Gemini API key. Set GEMINI_API_KEY in .env file to use your own key.');
    }
  }

  // Method to update API key dynamically
  setApiKey(newApiKey) {
    if (!newApiKey || typeof newApiKey !== 'string' || newApiKey.trim() === '') {
      throw new Error('Invalid API key provided');
    }
    this.apiKey = newApiKey.trim();
    // Reinitialize the client with new API key
    this.ai = new GoogleGenAI({
      apiKey: this.apiKey
    });
    console.log('✅ Gemini API key updated');
    return true;
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
      
      // Use the new SDK
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: fullMessage
      });

      // Extract the response text
      const aiResponse = response.text;
      
      if (!aiResponse) {
        throw new Error('No response from Gemini API');
      }

      console.log('✅ Got response from Gemini');
      return aiResponse;
      
    } catch (error) {
      console.log('Error sending message to Gemini:', error.message || error);
      
      // Handle specific error cases
      if (error.message?.includes('API key')) {
        throw new Error('API key is invalid or does not have permission to use this model');
      }
      
      if (error.message?.includes('quota') || error.message?.includes('429')) {
        throw new Error('API quota exceeded. Please try again later.');
      }
      
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new Error('Gemini model not found. The model name might be incorrect.');
      }
      
      throw new Error(error.message || 'Failed to get response from AI');
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
