import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (userData) =>
        set({ user: userData, isAuthenticated: true }),
      clearUser: () =>
        set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'finance-auth-storage', // key in localStorage
    }
  )
);

export default useAuthStore;
