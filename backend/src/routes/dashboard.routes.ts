import { Router } from 'express';
import { getStats, getChartData } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/charts', getChartData);

export default router;
