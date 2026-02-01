import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    sendMessage,
    getChatHistory,
    clearChatHistory
} from '../controllers/chatController.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Send message to chatbot
router.post('/message', sendMessage);

// Get chat history
router.get('/history', getChatHistory);

// Clear chat history
router.delete('/history', clearChatHistory);

export default router;
