import apiClient from './client';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/auth.types';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },

  refresh: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/user/profile');
    return response.data.data;
  },
};