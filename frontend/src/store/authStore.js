import { create } from 'zustand';
import { authAPI } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('campusmind_user') || 'null'),
  token: localStorage.getItem('campusmind_token') || null,
  isAuthenticated: !!localStorage.getItem('campusmind_token'),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.login(credentials);
      const { access_token, user } = res.data;
      
      localStorage.setItem('campusmind_token', access_token);
      localStorage.setItem('campusmind_user', JSON.stringify(user));
      
      set({
        token: access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return user;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.register(data);
      const { access_token, user } = res.data;
      
      localStorage.setItem('campusmind_token', access_token);
      localStorage.setItem('campusmind_user', JSON.stringify(user));
      
      set({
        token: access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return user;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  fetchMe: async () => {
    const token = localStorage.getItem('campusmind_token');
    if (!token) return null;
    try {
      const res = await authAPI.getMe();
      const user = res.data;
      localStorage.setItem('campusmind_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
      return user;
    } catch (err) {
      get().logout();
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('campusmind_token');
    localStorage.removeItem('campusmind_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
