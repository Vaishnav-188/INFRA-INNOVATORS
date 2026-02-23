import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
    getAllUsers,
    getUserStats,
    getTopAlumni,
    getUserById,
    getPendingVerifications,
    verifyUser,
    rejectUser,
    requestAlumniStatus,
    convertToAlumni,
    deleteUsersByRole
} from '../controllers/userController.js';

const router = express.Router();

// Public routes
router.get('/top-alumni', getTopAlumni);

// Protected routes (student/alumni/admin)
router.post('/request-alumni', protect, requestAlumniStatus);

// Protected routes (admin only)
router.get('/', protect, adminOnly, getAllUsers);
router.get('/stats', protect, adminOnly, getUserStats);
router.get('/pending-verifications', protect, adminOnly, getPendingVerifications);
router.put('/verify/:id', protect, adminOnly, verifyUser);
router.delete('/reject/:id', protect, adminOnly, rejectUser);
router.put('/convert-to-alumni/:userId', protect, adminOnly, convertToAlumni);
router.delete('/bulk-delete/:role', protect, adminOnly, deleteUsersByRole);
router.get('/:id', protect, getUserById);

export default router;
