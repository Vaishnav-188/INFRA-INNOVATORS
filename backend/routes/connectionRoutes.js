import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getMatchingAlumni,
    createConnection,
    getMyConnections,
    updateConnectionStatus,
    getConnectionStats
} from '../controllers/connectionController.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get matching alumni (students only)
router.get('/match', getMatchingAlumni);

// Create connection request
router.post('/', createConnection);

// Get my connections
router.get('/', getMyConnections);

// Get connection statistics
router.get('/stats', getConnectionStats);

// Update connection status (alumni only)
router.patch('/:connectionId/status', updateConnectionStatus);

export default router;
