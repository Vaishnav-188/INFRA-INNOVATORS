import express from 'express';
import { register, login, getMe, verifyEmail } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/verify-email', verifyEmail);
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

export default router;
