import { api } from './api';

export const authApi = {
  login: (credentials: any): Promise<any> => api.post('/auth/login', credentials),
  getMe: (): Promise<any> => api.get('/auth/me'),
};
