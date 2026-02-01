import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getAllUsers,
    getUserStats,
    getTopAlumni,
    getUserById,
    getPendingVerifications,
    verifyUser,
    rejectUser
} from '../controllers/userController.js';

const router = express.Router();

// Public routes
router.get('/top-alumni', getTopAlumni);

// Protected routes (admin only)
router.get('/', protect, getAllUsers);
router.get('/stats', protect, getUserStats);
router.get('/pending-verifications', protect, getPendingVerifications);
router.put('/verify/:id', protect, verifyUser);
router.delete('/reject/:id', protect, rejectUser);
router.get('/:id', protect, getUserById);

export default router;
