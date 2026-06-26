import { api } from './api';

export const settingsApi = {
  getSettings: (): Promise<any> => api.get('/settings'),
  updateFees: (messFee: number): Promise<any> => api.put('/settings/fees', { messFee }),
  updateMeals: (bf: number, lu: number, di: number): Promise<any> => api.put('/settings/meals', { bf, lu, di }),
  getHostels: (): Promise<any> => api.get('/settings/hostels'),
  createHostel: (name: string): Promise<any> => api.post('/settings/hostels', { name }),
  deleteHostel: (name: string): Promise<any> => api.delete(`/settings/hostels/${name}`),
};
