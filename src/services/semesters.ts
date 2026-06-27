import { api } from './api';

export const semestersApi = {
  getAll: (): Promise<any> => api.get('/semesters'),
  create: (data: any): Promise<any> => api.post('/semesters', data),
};
