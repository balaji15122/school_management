import api from './api';

export const studentService = {
  getStudents: async (params = {}) => {
    const res = await api.get('/students', { params });
    return res.data;
  },

  getStudentById: async (id) => {
    const res = await api.get(`/students/${id}`);
    return res.data;
  },

  createStudent: async (studentData) => {
    const res = await api.post('/students', studentData);
    return res.data;
  },

  updateStudent: async (id, studentData) => {
    const res = await api.patch(`/students/${id}`, studentData);
    return res.data;
  },

  deleteStudent: async (id) => {
    const res = await api.delete(`/students/${id}`);
    return res.data;
  },

  forwardStudents: async ({ studentId, ids } = {}) => {
    let endpoint = '/students/forward';
    let payload = {};

    if (studentId) {
      endpoint = `/students/${studentId}/forward`;
    } else if (ids && ids.length > 0) {
      endpoint = '/students/bulk/forward';
      payload = { ids };
    }

    const res = await api.patch(endpoint, payload);
    return res.data;
  },

  updateStatus: async (studentId, { status, rejectionReason }) => {
    const res = await api.patch(`/students/${studentId}/status`, {
      status,
      rejectionReason: rejectionReason || '',
    });
    return res.data;
  },

  bulkUpdateStatus: async ({ ids, status, rejectionReason }) => {
    const res = await api.patch('/students/bulk/status', {
      ids,
      status,
      rejectionReason: rejectionReason || '',
    });
    return res.data;
  },

  uploadPhoto: async ({ imageBase64, fileName, admissionNumber, schoolCode }) => {
    const res = await api.post('/upload/photo', {
      imageBase64,
      fileName,
      admissionNumber: admissionNumber || null,
      schoolCode: schoolCode || null,
    });
    return res.data;
  },
};
