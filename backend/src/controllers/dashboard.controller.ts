import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { dashboardService } from '../services/dashboard.service.js';

export async function getStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await dashboardService.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
}

export async function getChartData(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const charts = await dashboardService.getChartData();
    res.json({ success: true, charts });
  } catch (error) {
    next(error);
  }
}
