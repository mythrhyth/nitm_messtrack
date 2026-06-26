import { Router } from 'express';
import {
  getAll,
  getByRollNo,
  create,
  update,
  remove,
  bulkImport,
  bulkDelete
} from '../controllers/students.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import {
  StudentSchema,
  BulkImportStudentsSchema,
  BulkDeleteStudentsSchema
} from '../models/validation.js';

const router = Router();

router.use(authenticate);

router.get('/', getAll);
router.get('/:rollNo', getByRollNo);

// Admin-only endpoints
router.post('/', requireAdmin, validateBody(StudentSchema), create);
router.put('/:rollNo', requireAdmin, update);
router.delete('/:rollNo', requireAdmin, remove);
router.post('/bulk-import', requireAdmin, validateBody(BulkImportStudentsSchema), bulkImport);
router.post('/bulk-delete', requireAdmin, validateBody(BulkDeleteStudentsSchema), bulkDelete);

export default router;
