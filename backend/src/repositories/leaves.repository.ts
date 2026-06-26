import { prisma } from '../config/db.js';
import { LeaveRecord } from '@prisma/client';

export class LeavesRepository {
  async findAll(search?: string): Promise<LeaveRecord[]> {
    const where: any = {};
    if (search) {
      where.OR = [
        { rollNo: { contains: search } },
        { studentName: { contains: search } }
      ];
    }
    return prisma.leaveRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string): Promise<LeaveRecord | null> {
    return prisma.leaveRecord.findUnique({
      where: { id }
    });
  }

  async findByRollNo(rollNo: string): Promise<LeaveRecord[]> {
    return prisma.leaveRecord.findMany({
      where: { rollNo },
      orderBy: { leaveStart: 'desc' }
    });
  }

  async create(data: Omit<LeaveRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeaveRecord> {
    return prisma.leaveRecord.create({
      data
    });
  }

  async delete(id: string): Promise<LeaveRecord> {
    return prisma.leaveRecord.delete({
      where: { id }
    });
  }
}

export const leavesRepository = new LeavesRepository();
