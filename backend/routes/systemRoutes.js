import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { getSettings, updateSettings, uploadQrCode } from '../controllers/systemController.js';
import imageUpload from '../middleware/imageUpload.js';

const router = express.Router();

router.get('/settings', getSettings);
router.put('/settings', protect, adminOnly, updateSettings);
router.post('/upload-qr', protect, adminOnly, imageUpload.single('qrCode'), uploadQrCode);

export default router;
