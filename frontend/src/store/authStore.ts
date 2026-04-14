import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, IntegrationMode } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  integrationMode: IntegrationMode;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setIntegrationMode: (mode: IntegrationMode) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      integrationMode: 'standalone',
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      setIntegrationMode: (mode) => set({ integrationMode: mode }),
    }),
    {
      name: 'zlms-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
