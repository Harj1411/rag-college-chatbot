import { create } from 'zustand';
import { authAPI } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('campusmind_user') || 'null'),
  token: localStorage.getItem('campusmind_token') || null,
  isAuthenticated: !!localStorage.getItem('campusmind_token'),
  isLoading: false,
  error: null,

  unverifiedEmail: localStorage.getItem('campusmind_unverified_email') || null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.login(credentials);
      const { access_token, user } = res.data;
      
      localStorage.setItem('campusmind_token', access_token);
      localStorage.setItem('campusmind_user', JSON.stringify(user));
      localStorage.removeItem('campusmind_unverified_email');
      
      set({
        token: access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        unverifiedEmail: null,
      });
      return user;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      const isUnverified = err.response?.status === 403 && msg.toLowerCase().includes('verify');
      if (isUnverified) {
        localStorage.setItem('campusmind_unverified_email', credentials.email);
        set({ unverifiedEmail: credentials.email });
      }
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.register(data);
      const { requires_verification, access_token, user } = res.data;

      if (requires_verification) {
        localStorage.setItem('campusmind_unverified_email', data.email);
        set({
          isLoading: false,
          error: null,
          unverifiedEmail: data.email,
        });
        return res.data;
      }

      // If verification is disabled and token returned immediately
      if (access_token && user) {
        localStorage.setItem('campusmind_token', access_token);
        localStorage.setItem('campusmind_user', JSON.stringify(user));
        localStorage.removeItem('campusmind_unverified_email');
        set({
          token: access_token,
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          unverifiedEmail: null,
        });
      }
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  verifyEmail: async ({ email, otp }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.verifyEmail({ email, otp });
      const { access_token, user } = res.data;

      localStorage.setItem('campusmind_token', access_token);
      localStorage.setItem('campusmind_user', JSON.stringify(user));
      localStorage.removeItem('campusmind_unverified_email');

      set({
        token: access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        unverifiedEmail: null,
      });
      return user;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Verification failed. Please check the code.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  resendOTP: async ({ email }) => {
    set({ error: null });
    try {
      const res = await authAPI.resendOTP({ email });
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to resend code. Please try again.';
      set({ error: msg });
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
