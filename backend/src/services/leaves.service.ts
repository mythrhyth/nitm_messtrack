import { prisma } from '../config/db.js';
import { leavesRepository } from '../repositories/leaves.repository.js';
import { studentsRepository } from '../repositories/students.repository.js';
import { settingsRepository } from '../repositories/settings.repository.js';

export class LeavesService {
  async getAllLeaves(search?: string) {
    return leavesRepository.findAll(search);
  }

  async getStudentLeaves(rollNo: string) {
    return leavesRepository.findByRollNo(rollNo);
  }

  async createLeave(data: {
    rollNo: string;
    leaveStart: string;
    leaveEnd: string;
    reason?: string;
    semester: string;
  }) {
    const student = await studentsRepository.findByRollNo(data.rollNo);
    if (!student) {
      throw new Error('Student not found');
    }

    const start = new Date(data.leaveStart);
    const end = new Date(data.leaveEnd);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (days <= 0) {
      throw new Error('Leave end date must be after start date');
    }

    const bfRate = Number(await settingsRepository.getSettingValue('bf') || '30');
    const luRate = Number(await settingsRepository.getSettingValue('lu') || '65');
    const diRate = Number(await settingsRepository.getSettingValue('di') || '65');

    const bfMissed = days;
    const luMissed = days;
    const diMissed = Math.max(0, days - 1);
    const refundAmount = bfMissed * bfRate + luMissed * luRate + diMissed * diRate;

    const leaveReason = data.reason?.trim() || 'Vacation';

    return prisma.$transaction(async (tx) => {
      const leave = await tx.leaveRecord.create({
        data: {
          rollNo: student.rollNo,
          studentName: student.name,
          hostel: student.hostel,
          leaveStart: data.leaveStart,
          leaveEnd: data.leaveEnd,
          reason: leaveReason,
          breakfastMissed: bfMissed,
          lunchMissed: luMissed,
          dinnerMissed: diMissed,
          refundAmount,
          semester: data.semester,
          status: 'Verified'
        }
      });

      // Update student status & refund
      await tx.student.update({
        where: { rollNo: student.rollNo },
        data: {
          refundEarned: { increment: refundAmount },
          status: 'On Leave'
        }
      });

      return leave;
    });
  }

  async deleteLeave(id: string) {
    const leave = await leavesRepository.findById(id);
    if (!leave) {
      throw new Error('Leave record not found');
    }

    return prisma.$transaction(async (tx) => {
      await tx.leaveRecord.delete({ where: { id } });

      // decrement refundEarned on student, and restore status to Active
      await tx.student.update({
        where: { rollNo: leave.rollNo },
        data: {
          refundEarned: { decrement: leave.refundAmount },
          status: 'Active'
        }
      });
      return leave;
    });
  }

  async updateLeave(id: string, data: {
    leaveStart: string;
    leaveEnd: string;
    reason?: string;
    semester?: string;
  }) {
    const oldLeave = await leavesRepository.findById(id);
    if (!oldLeave) {
      throw new Error('Leave record not found');
    }

    const start = new Date(data.leaveStart);
    const end = new Date(data.leaveEnd);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (days <= 0) {
      throw new Error('Leave end date must be after start date');
    }

    const bfRate = Number(await settingsRepository.getSettingValue('bf') || '30');
    const luRate = Number(await settingsRepository.getSettingValue('lu') || '65');
    const diRate = Number(await settingsRepository.getSettingValue('di') || '65');

    const bfMissed = days;
    const luMissed = days;
    const diMissed = Math.max(0, days - 1);
    const refundAmount = bfMissed * bfRate + luMissed * luRate + diMissed * diRate;

    const leaveReason = data.reason?.trim() || 'Vacation';

    return prisma.$transaction(async (tx) => {
      const updatedLeave = await tx.leaveRecord.update({
        where: { id },
        data: {
          leaveStart: data.leaveStart,
          leaveEnd: data.leaveEnd,
          reason: leaveReason,
          breakfastMissed: bfMissed,
          lunchMissed: luMissed,
          dinnerMissed: diMissed,
          refundAmount,
          semester: data.semester || oldLeave.semester,
        }
      });

      // Update student refund: subtract old refund and add new refund
      const refundDifference = refundAmount - oldLeave.refundAmount;
      await tx.student.update({
        where: { rollNo: oldLeave.rollNo },
        data: {
          refundEarned: { increment: refundDifference }
        }
      });

      return updatedLeave;
    });
  }
}

export const leavesService = new LeavesService();
