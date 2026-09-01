import api from './api';

export const schoolService = {
  getSchools: async () => {
    const res = await api.get('/schools');
    return res.data;
  },

  getSchoolById: async (id) => {
    const res = await api.get(`/schools/${id}`);
    return res.data;
  },

  getSchoolByCode: async (code) => {
    const res = await api.get(`/schools/by-code/${code}`);
    return res.data;
  },

  createSchool: async (schoolData) => {
    const res = await api.post('/schools', schoolData);
    return res.data;
  },

  updateSchool: async (id, schoolData) => {
    const res = await api.patch(`/schools/${id}`, schoolData);
    return res.data;
  },
};
