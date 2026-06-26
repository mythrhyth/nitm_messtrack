import { api } from './api';

export const leavesApi = {
  getAll: (search?: string): Promise<any> => api.get('/leaves', { params: { search } }),
  getStudentLeaves: (rollNo: string): Promise<any> => api.get(`/leaves/student/${rollNo}`),
  create: (data: any): Promise<any> => api.post('/leaves', data),
  update: (id: string, data: any): Promise<any> => api.put(`/leaves/${id}`, data),
  delete: (id: string): Promise<any> => api.delete(`/leaves/${id}`),
};
