import apiClient from '../api/apiClient';

export const studentService = {
  getStudents: async () => {
    const response = await apiClient.get('/getStudents');
    return response.data;
  },

  searchStudents: async (query) => {
    const response = await apiClient.get('/searchStudents', {
      params: { query },
    });
    return response.data;
  },

  createStudent: async (studentData) => {
    const response = await apiClient.post('/createStudent', studentData);
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await apiClient.delete('/deleteStudent', {
      data: { id },
    });
    return response.data;
  },

  sendTicket: async (id) => {
    const response = await apiClient.patch('/send-ticket', { id });
    return response.data;
  },
};

export default studentService;
