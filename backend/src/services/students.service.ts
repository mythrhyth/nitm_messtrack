import bcrypt from 'bcrypt';
import { prisma } from '../config/db.js';
import { Student } from '@prisma/client';
import { studentsRepository } from '../repositories/students.repository.js';

export class StudentsService {
  async getAllStudents(filters: { search?: string; hostel?: string; status?: string; semester?: string }) {
    return studentsRepository.findAll(filters);
  }

  async getStudent(rollNo: string) {
    const s = await studentsRepository.findByRollNo(rollNo);
    if (!s) {
      throw new Error('Student not found');
    }
    return s;
  }

  async createStudent(data: Omit<Student, 'createdAt' | 'updatedAt'>) {
    const existing = await studentsRepository.findByRollNo(data.rollNo);
    if (existing) {
      throw new Error('Student with this roll number already exists');
    }

    const emailExisting = await prisma.student.findFirst({ where: { email: data.email } });
    if (emailExisting) {
      throw new Error('Student with this email address already exists');
    }

    const dobValue = data.dob || '2003-06-15';
    const hashedDob = await bcrypt.hash(dobValue, 10);

    return prisma.$transaction(async (tx) => {
      const student = await tx.student.create({ data });
      await tx.user.create({
        data: {
          username: student.rollNo,
          password: hashedDob,
          role: 'student',
          studentId: student.rollNo
        }
      });
      return student;
    });
  }

  async updateStudent(rollNo: string, data: Partial<Student>) {
    if (data.email) {
      const emailExisting = await prisma.student.findFirst({
        where: {
          email: data.email,
          NOT: { rollNo }
        }
      });
      if (emailExisting) {
        throw new Error('Student with this email address already exists');
      }
    }

    return prisma.$transaction(async (tx) => {
      const student = await tx.student.update({
        where: { rollNo },
        data
      });

      if (data.dob) {
        const hashedDob = await bcrypt.hash(data.dob, 10);
        await tx.user.update({
          where: { username: rollNo },
          data: { password: hashedDob }
        });
      }

      return student;
    });
  }


  async deleteStudent(rollNo: string) {
    return studentsRepository.delete(rollNo);
  }

  async bulkImport(students: Omit<Student, 'createdAt' | 'updatedAt'>[]) {
    let count = 0;
    for (const s of students) {
      const existing = await studentsRepository.findByRollNo(s.rollNo);
      if (!existing) {
        const dobValue = s.dob || '2003-06-15';
        const hashedDob = await bcrypt.hash(dobValue, 10);
        await prisma.$transaction(async (tx) => {
          await tx.student.create({ data: s });
          await tx.user.create({
            data: {
              username: s.rollNo,
              password: hashedDob,
              role: 'student',
              studentId: s.rollNo
            }
          });
        });
        count++;
      }
    }
    return count;
  }

  async bulkDelete(rollNumbers: string[]) {
    return studentsRepository.bulkDelete(rollNumbers);
  }
}

export const studentsService = new StudentsService();
