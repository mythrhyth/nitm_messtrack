import { api } from './api';

export const dashboardApi = {
  getStats: (): Promise<any> => api.get('/dashboard/stats'),
  getCharts: (): Promise<any> => api.get('/dashboard/charts'),
};
