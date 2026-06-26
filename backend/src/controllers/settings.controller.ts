import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { settingsService } from '../services/settings.service.js';

export async function getSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getSystemSettings();
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
}

export async function updateFees(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { messFee } = req.body;
    const result = await settingsService.updateFees(messFee);
    res.json({ success: true, settings: result });
  } catch (error) {
    next(error);
  }
}

export async function updateMeals(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { bf, lu, di } = req.body;
    const result = await settingsService.updateMeals(bf, lu, di);
    res.json({ success: true, settings: result });
  } catch (error) {
    next(error);
  }
}

export async function getHostels(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const hostels = await settingsService.getHostels();
    res.json({ success: true, hostels });
  } catch (error) {
    next(error);
  }
}

export async function createHostel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name } = req.body;
    const hostel = await settingsService.createHostel(name);
    res.status(201).json({ success: true, hostel });
  } catch (error) {
    next(error);
  }
}

export async function removeHostel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await settingsService.deleteHostel(req.params.name as string);
    res.json({ success: true, message: 'Hostel deleted successfully' });
  } catch (error) {
    next(error);
  }
}
