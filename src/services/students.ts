import { api } from './api';

export const studentsApi = {
  getAll: (filters: { search?: string; hostel?: string; status?: string; semester?: string }): Promise<any> => 
    api.get('/students', { params: filters }),

  getByRollNo: (rollNo: string): Promise<any> => api.get(`/students/${rollNo}`),
  create: (data: any): Promise<any> => api.post('/students', data),
  update: (rollNo: string, data: any): Promise<any> => api.put(`/students/${rollNo}`, data),
  delete: (rollNo: string): Promise<any> => api.delete(`/students/${rollNo}`),
  bulkImport: (students: any[]): Promise<any> => api.post('/students/bulk-import', { students }),
  bulkDelete: (rollNumbers: string[]): Promise<any> => api.post('/students/bulk-delete', { rollNumbers }),
};
