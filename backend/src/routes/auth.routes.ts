import { Router } from 'express';
import { login, getMe, changePassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { LoginSchema, ChangePasswordSchema } from '../models/validation.js';

const router = Router();

router.post('/login', validateBody(LoginSchema), login);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, validateBody(ChangePasswordSchema), changePassword);

export default router;

