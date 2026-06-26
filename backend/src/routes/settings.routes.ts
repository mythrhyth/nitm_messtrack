import { Router } from 'express';
import {
  getSettings,
  updateFees,
  updateMeals,
  getHostels,
  createHostel,
  removeHostel
} from '../controllers/settings.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { SystemFeesSchema, MealPricesSchema, HostelSchema } from '../models/validation.js';

const router = Router();

router.use(authenticate);

router.get('/', getSettings);
router.get('/hostels', getHostels);

// Admin-only endpoints
router.put('/fees', requireAdmin, validateBody(SystemFeesSchema), updateFees);
router.put('/meals', requireAdmin, validateBody(MealPricesSchema), updateMeals);
router.post('/hostels', requireAdmin, validateBody(HostelSchema), createHostel);
router.delete('/hostels/:name', requireAdmin, removeHostel);

export default router;
