import { prisma } from '../config/db.js';
import { Hostel, SystemSetting } from '@prisma/client';

export class SettingsRepository {
  async getSettings(): Promise<SystemSetting[]> {
    return prisma.systemSetting.findMany();
  }

  async getSettingValue(key: string): Promise<string | null> {
    const s = await prisma.systemSetting.findUnique({ where: { key } });
    return s ? s.value : null;
  }

  async updateSetting(key: string, value: string): Promise<SystemSetting> {
    return prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  }

  async getHostels(): Promise<Hostel[]> {
    return prisma.hostel.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async createHostel(name: string): Promise<Hostel> {
    return prisma.hostel.create({
      data: { name }
    });
  }

  async deleteHostel(name: string): Promise<Hostel> {
    return prisma.hostel.delete({
      where: { name }
    });
  }
}

export const settingsRepository = new SettingsRepository();
