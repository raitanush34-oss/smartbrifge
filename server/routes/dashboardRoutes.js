import express from 'express';
import { getDashboardMetrics } from '../controllers/dashboardController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.get('/metrics', getDashboardMetrics);

export default router;
