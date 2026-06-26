import { prisma } from '../config/db.js';
import { User, Student } from '@prisma/client';

export type UserWithStudent = User & {
  student: Student | null;
};

export class UsersRepository {
  async findByUsername(username: string): Promise<UserWithStudent | null> {
    return prisma.user.findUnique({
      where: { username },
      include: { student: true }
    });
  }

  async findById(id: string): Promise<UserWithStudent | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { student: true }
    });
  }
}

export const usersRepository = new UsersRepository();
