import { prisma } from '../config/db.js';
import { Semester } from '@prisma/client';

export class SemestersRepository {
  async findAll(): Promise<Semester[]> {
    return prisma.semester.findMany({
      orderBy: { startDate: 'desc' }
    });
  }

  async findByName(name: string): Promise<Semester | null> {
    return prisma.semester.findUnique({
      where: { name }
    });
  }

  async findActive(): Promise<Semester | null> {
    return prisma.semester.findFirst({
      where: { isActive: true }
    });
  }

  async create(data: {
    name: string;
    year: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    description?: string;
  }): Promise<Semester> {
    return prisma.semester.create({
      data
    });
  }

  async deactivateAll(): Promise<void> {
    await prisma.semester.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });
  }
}

export const semestersRepository = new SemestersRepository();
