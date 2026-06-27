import { Router } from 'express';
import { getSemesters, createSemester } from '../controllers/semesters.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { SemesterCreateSchema } from '../models/validation.js';

const router = Router();

router.use(authenticate);

router.get('/', getSemesters);
router.post('/', requireAdmin, validateBody(SemesterCreateSchema), createSemester);

export default router;
