import express from 'express';
import { sendMessage, getStatus } from '../controllers/ai.controller.js';

const router = express.Router();

/**
 * AI Chat Routes
 * Base path: /api/ai
 */

// POST /api/ai/chat - Send a message to the AI
router.post('/chat', sendMessage);

// GET /api/ai/status - Get AI service status
router.get('/status', getStatus);

export default router;

