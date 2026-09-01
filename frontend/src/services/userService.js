import api from './api';

export const userService = {
  getUsers: async () => {
    const res = await api.get('/users');
    return res.data;
  },

  toggleUserStatus: async (userId) => {
    const res = await api.patch(`/users/${userId}/toggle-status`);
    return res.data;
  },
};
