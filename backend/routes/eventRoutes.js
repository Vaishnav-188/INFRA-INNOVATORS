import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    getAllEvents,
    getMyEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    updateEventStatus,
    getPendingEvents
} from '../controllers/eventController.js';

const router = express.Router();

// Public routes
router.get('/', getAllEvents);

// Protected routes
router.get('/my', protect, getMyEvents);
router.get('/pending', protect, authorize('admin'), getPendingEvents);
router.post('/', protect, authorize('admin', 'alumni'), createEvent);
router.patch('/:id', protect, authorize('admin', 'alumni'), updateEvent);
router.delete('/:id', protect, authorize('admin', 'alumni'), deleteEvent);
router.patch('/:id/status', protect, authorize('admin'), updateEventStatus);

export default router;
