import { prisma } from '../config/db.js';
import { Student } from '@prisma/client';

export class StudentsRepository {
  async findAll(filters: {
    search?: string;
    hostel?: string;
    status?: string;
  }): Promise<Student[]> {
    const where: any = {};

    if (filters.hostel && filters.hostel !== 'All') {
      where.hostel = filters.hostel;
    }
    if (filters.status && filters.status !== 'All') {
      where.status = filters.status;
    }
    if (filters.search) {
      const q = filters.search;
      where.OR = [
        { rollNo: { contains: q } },
        { name: { contains: q } },
        { dept: { contains: q } }
      ];
    }

    return prisma.student.findMany({
      where,
      orderBy: { rollNo: 'asc' }
    });
  }

  async findByRollNo(rollNo: string): Promise<Student | null> {
    return prisma.student.findUnique({
      where: { rollNo }
    });
  }

  async create(data: Omit<Student, 'createdAt' | 'updatedAt'>): Promise<Student> {
    return prisma.student.create({
      data
    });
  }

  async update(rollNo: string, data: Partial<Student>): Promise<Student> {
    return prisma.student.update({
      where: { rollNo },
      data
    });
  }

  async delete(rollNo: string): Promise<Student> {
    return prisma.student.delete({
      where: { rollNo }
    });
  }

  async bulkDelete(rollNumbers: string[]): Promise<number> {
    const res = await prisma.student.deleteMany({
      where: {
        rollNo: { in: rollNumbers }
      }
    });
    return res.count;
  }
}

export const studentsRepository = new StudentsRepository();
