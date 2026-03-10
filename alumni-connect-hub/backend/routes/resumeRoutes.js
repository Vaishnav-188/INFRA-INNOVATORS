import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { protect, authorize } from '../middleware/auth.js';
import {
    uploadResume,
    getJobApplications,
    updateApplicationStatus,
    runAIScreening,
    getMyApplicationStatus,
    getMyShortlistNotifications,
    getMyApplications,
    downloadResume
} from '../controllers/resumeController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure resume upload directory exists
const resumeDir = path.join(__dirname, '..', 'uploads', 'resumes');
if (!fs.existsSync(resumeDir)) {
    fs.mkdirSync(resumeDir, { recursive: true });
}

// Multer storage — save PDFs into backend/uploads/resumes/
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, resumeDir),
    filename: (req, file, cb) => {
        const unique = `${req.user._id}_${req.params.jobId}_${Date.now()}.pdf`;
        cb(null, unique);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are accepted'), false);
        }
    }
});

// Student: Get their shortlist notifications (check all jobs)
router.get('/my-notifications', protect, authorize('student'), getMyShortlistNotifications);

// Student: Get all their applications
router.get('/my-applications', protect, authorize('student'), getMyApplications);

// Student: Check application status for a specific job
router.get('/:jobId/my-status', protect, authorize('student'), getMyApplicationStatus);

// Student: Upload resume for a job
router.post('/:jobId/apply', protect, authorize('student'), upload.single('resume'), uploadResume);

// Alumni/Admin: Get all applications for a job
router.get('/:jobId/applications', protect, authorize('alumni', 'admin'), getJobApplications);

// Alumni/Admin: Shortlist or reject an application
router.patch('/:applicationId/shortlist', protect, authorize('alumni', 'admin'), updateApplicationStatus);

// Alumni/Admin: Trigger AI screening
router.post('/:applicationId/screen', protect, authorize('alumni', 'admin'), runAIScreening);

// Alumni/Admin: Download student resume
router.get('/:applicationId/download', protect, authorize('alumni', 'admin'), downloadResume);

export default router;
