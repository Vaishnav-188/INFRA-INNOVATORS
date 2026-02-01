import express from 'express';
import { uploadStudentCSV, uploadAlumniCSV } from '../controllers/csvController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Upload student CSV - Admin only
router.post('/upload-students', protect, adminOnly, upload.single('csvFile'), uploadStudentCSV);

// Upload alumni CSV - Admin only
router.post('/upload-alumni', protect, adminOnly, upload.single('csvFile'), uploadAlumniCSV);

export default router;
