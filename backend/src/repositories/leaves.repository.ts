import { prisma } from '../config/db.js';
import { LeaveRecord } from '@prisma/client';

export class LeavesRepository {
  async findAll(filters: {
    search?: string;
    semester?: string;
    hostel?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<LeaveRecord[]> {
    const where: any = {};

    if (filters.semester && filters.semester !== 'All') {
      where.semester = filters.semester;
    }
    if (filters.hostel && filters.hostel !== 'All') {
      where.hostel = filters.hostel;
    }
    if (filters.status && filters.status !== 'All') {
      where.status = filters.status;
    }
    if (filters.startDate) {
      where.leaveStart = { gte: filters.startDate };
    }
    if (filters.endDate) {
      where.leaveEnd = { lte: filters.endDate };
    }

    if (filters.search) {
      const q = filters.search;
      where.OR = [
        { rollNo: { contains: q, mode: 'insensitive' } },
        { studentName: { contains: q, mode: 'insensitive' } }
      ];
    }

    return prisma.leaveRecord.findMany({
      where,
      orderBy: { leaveStart: 'desc' }
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
