import api from './api';

export const dashboardService = {
  getDashboardStats: async () => {
    const res = await api.get('/dashboard/stats');
    return res.data;
  },
};
