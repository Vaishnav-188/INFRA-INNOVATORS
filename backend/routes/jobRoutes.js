import express from 'express';
import {
    getAllJobs,
    getJobById,
    createJob,
    deleteJob,
    updateJobStatus,
    applyForJob
} from '../controllers/jobController.js';
import { protect, authorize, studentAccess } from '../middleware/auth.js';

const router = express.Router();

// Get all jobs - accessible to all authenticated users
router.get('/', protect, getAllJobs);

// Get single job by ID - accessible to all authenticated users
router.get('/:id', protect, getJobById);

// Apply for job - Students only (redirects to company website)
router.get('/:id/apply', protect, authorize('student'), applyForJob);

// Create job - Admin or Alumni
router.post('/', protect, authorize('admin', 'alumni'), createJob);

// Update job status - Admin or Alumni (alumni check in controller)
router.patch('/:id/status', protect, authorize('admin', 'alumni'), updateJobStatus);

// Delete job - Admin or Alumni (alumni check in controller)
router.delete('/:id', protect, authorize('admin', 'alumni'), deleteJob);

export default router;
