import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { leavesService } from '../services/leaves.service.js';

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search } = req.query;
    const leaves = await leavesService.getAllLeaves(search ? String(search) : undefined);
    res.json({ success: true, leaves });
  } catch (error) {
    next(error);
  }
}

export async function getStudentLeaves(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const leaves = await leavesService.getStudentLeaves(req.params.rollNo as string);
    res.json({ success: true, leaves });
  } catch (error) {
    next(error);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const leave = await leavesService.createLeave(req.body);
    res.status(201).json({ success: true, leave });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await leavesService.deleteLeave(req.params.id as string);
    res.json({ success: true, message: 'Leave record deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const leave = await leavesService.updateLeave(req.params.id as string, req.body);
    res.json({ success: true, leave });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}
