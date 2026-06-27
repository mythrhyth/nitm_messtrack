import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { semestersService } from '../services/semesters.service.js';

export async function getSemesters(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const semesters = await semestersService.getSemesters();
    res.json({ success: true, semesters });
  } catch (error) {
    next(error);
  }
}

export async function createSemester(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const semester = await semestersService.createSemester(req.body);
    res.status(201).json({ success: true, semester });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}
