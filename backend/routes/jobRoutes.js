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

// Create job - Alumni and Admin only
router.post('/', protect, authorize('alumni', 'admin'), createJob);

// Update job status - Alumni (own jobs) and Admin
router.patch('/:id/status', protect, authorize('alumni', 'admin'), updateJobStatus);

// Delete job - Alumni (own jobs) and Admin
router.delete('/:id', protect, authorize('alumni', 'admin'), deleteJob);

export default router;
