import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    getMyDonations,
    createDonation,
    getAllDonations
} from '../controllers/donationController.js';

const router = express.Router();

// Alumni routes
router.get('/my', protect, authorize('alumni'), getMyDonations);
router.post('/', protect, authorize('alumni'), createDonation);

// Admin routes
router.get('/', protect, authorize('admin'), getAllDonations);

export default router;
