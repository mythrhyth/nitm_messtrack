import { Router } from 'express';
import { getAll, getStudentLeaves, create, remove, update } from '../controllers/leaves.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { LeaveSchema } from '../models/validation.js';

const router = Router();

router.use(authenticate);

router.get('/', getAll);
router.get('/student/:rollNo', getStudentLeaves);
router.post('/', validateBody(LeaveSchema), create);
router.put('/:id', requireAdmin, update);
router.delete('/:id', requireAdmin, remove);

export default router;
