import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { authService } from '../services/auth.service.js';

export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message });
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const result = await authService.getMe(req.user.id);
    res.json({ success: true, user: result });
  } catch (error: any) {
    next(error);
  }
}
