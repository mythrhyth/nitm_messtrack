import { settingsRepository } from '../repositories/settings.repository.js';

export class SettingsService {
  async getSystemSettings() {
    const settings = await settingsRepository.getSettings();
    const result: Record<string, number> = {};
    settings.forEach((s) => {
      result[s.key] = Number(s.value);
    });
    return {
      messFee: result.messFee || 25000,
      bf: result.bf || 30,
      lu: result.lu || 65,
      di: result.di || 65
    };
  }

  async updateFees(messFee: number) {
    await settingsRepository.updateSetting('messFee', String(messFee));
    return { messFee };
  }

  async updateMeals(bf: number, lu: number, di: number) {
    await settingsRepository.updateSetting('bf', String(bf));
    await settingsRepository.updateSetting('lu', String(lu));
    await settingsRepository.updateSetting('di', String(di));
    return { bf, lu, di };
  }

  async getHostels() {
    const list = await settingsRepository.getHostels();
    return list.map((h) => h.name);
  }

  async createHostel(name: string) {
    return settingsRepository.createHostel(name);
  }

  async deleteHostel(name: string) {
    return settingsRepository.deleteHostel(name);
  }
}

export const settingsService = new SettingsService();
