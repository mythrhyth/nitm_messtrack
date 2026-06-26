import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { studentsService } from '../services/students.service.js';

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, hostel, status } = req.query;
    const students = await studentsService.getAllStudents({
      search: search ? String(search) : undefined,
      hostel: hostel ? String(hostel) : undefined,
      status: status ? String(status) : undefined
    });
    res.json({ success: true, students });
  } catch (error) {
    next(error);
  }
}

export async function getByRollNo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const student = await studentsService.getStudent(req.params.rollNo as string);
    res.json({ success: true, student });
  } catch (error) {
    next(error);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const student = await studentsService.createStudent(req.body);
    res.status(201).json({ success: true, student });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const student = await studentsService.updateStudent(req.params.rollNo as string, req.body);
    res.json({ success: true, student });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await studentsService.deleteStudent(req.params.rollNo as string);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function bulkImport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const count = await studentsService.bulkImport(req.body.students);
    res.json({ success: true, count, message: `Successfully imported ${count} students` });
  } catch (error) {
    next(error);
  }
}

export async function bulkDelete(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const count = await studentsService.bulkDelete(req.body.rollNumbers);
    res.json({ success: true, count, message: `Successfully deleted ${count} students` });
  } catch (error) {
    next(error);
  }
}
