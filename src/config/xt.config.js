import dotenv from 'dotenv';

dotenv.config();

export const xtConfig = {
  apiKey: '7af8e0ff-5e1d-4789-ab59-24e92dad1103',
  secretKey: 'c7de25de14872e1a9c978453b9056a7f18b416c1',
  baseUrl: process.env.XT_API_BASE_URL || 'https://sapi.xt.com',
  endpoints: {
    balance: '/v4/balances',
    order: '/v4/order',
    orders: '/v4/orders',
    symbols: '/v4/public/symbol',
    ticker: '/v4/public/ticker',
    depth: '/v4/public/depth'
  }
};

export const validateConfig = () => {
  if (!xtConfig.apiKey || !xtConfig.secretKey) {
    throw new Error('XT Exchange API credentials are not configured. Please set XT_API_KEY and XT_SECRET_KEY in .env file');
  }
};

