import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isCheckingAuth: true,
      setUser: (userData) =>
        set({ user: userData, isAuthenticated: true, isCheckingAuth: false }),
      clearUser: () =>
        set({ user: null, isAuthenticated: false, isCheckingAuth: false }),
      checkAuth: async () => {
        set({ isCheckingAuth: true });
        try {
          const res = await api.get('/auth/checkAuth');
          set({ user: res.data, isAuthenticated: true, isCheckingAuth: false });
        } catch (error) {
          set({ user: null, isAuthenticated: false, isCheckingAuth: false });
        }
      }
    }),
    {
      name: 'finance-auth-storage', // key in localStorage
    }
  )
);

export default useAuthStore;
