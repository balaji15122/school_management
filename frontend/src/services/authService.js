import api from './api';

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  registerSchool: async (schoolData) => {
    const res = await api.post('/auth/register-school', schoolData);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    }
  },

  refreshToken: async (refreshToken) => {
    const res = await api.post('/auth/refresh-token', { refreshToken });
    return res.data;
  },
};
