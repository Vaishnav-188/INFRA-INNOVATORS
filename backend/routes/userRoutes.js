import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getAllUsers,
    getUserStats,
    getTopAlumni,
    getUserById,
    getPendingVerifications,
    verifyUser,
    rejectUser,
    requestAlumniStatus,
    deleteUsersByRole
} from '../controllers/userController.js';

const router = express.Router();

// Public routes
router.get('/top-alumni', getTopAlumni);

// Protected routes (student/alumni/admin)
router.post('/request-alumni', protect, requestAlumniStatus);

// Protected routes (admin only)
router.get('/', protect, getAllUsers);
router.get('/stats', protect, getUserStats);
router.get('/pending-verifications', protect, getPendingVerifications);
router.put('/verify/:id', protect, verifyUser);
router.delete('/reject/:id', protect, rejectUser);
router.delete('/bulk-delete/:role', protect, deleteUsersByRole);
router.get('/:id', protect, getUserById);

export default router;
