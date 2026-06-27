import { semestersRepository } from '../repositories/semesters.repository.js';

export class SemestersService {
  async getSemesters() {
    return semestersRepository.findAll();
  }

  async createSemester(data: {
    name: string;
    year: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    description?: string;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid dates provided');
    }

    if (end <= start) {
      throw new Error('End date must be after the start date');
    }

    const existing = await semestersRepository.findByName(data.name);
    if (existing) {
      throw new Error('Semester with this name already exists');
    }

    if (data.isActive) {
      // Deactivate other semesters if this one is active
      await semestersRepository.deactivateAll();
    }

    return semestersRepository.create({
      name: data.name,
      year: data.year,
      startDate: start,
      endDate: end,
      isActive: data.isActive,
      description: data.description
    });
  }
}

export const semestersService = new SemestersService();
