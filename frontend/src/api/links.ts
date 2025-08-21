import apiClient from './client';
import type { Link, CreateLinkRequest } from '../types/links.types';

export const linksApi = {
  // Create short link (anonymous)
  createAnonymous: async (url: string) => {
    const response = await apiClient.post('/shorten', { url });
    return response.data.data;
  },

  // Create short link (authenticated)
  create: async (data: CreateLinkRequest) => {
    const response = await apiClient.post('/links', data);
    return response.data.data;
  },

  // Get user's links
  getUserLinks: async (page = 1, limit = 20) => {
    const response = await apiClient.get('/links', {
      params: { page, limit, sort: '-createdAt' }
    });
    return response.data.data;
  },

  // Get link info
  getLink: async (shortCode: string) => {
    const response = await apiClient.get(`/links/${shortCode}`);
    return response.data.data;
  },

  // Get link stats
  getLinkStats: async (shortCode: string) => {
    const response = await apiClient.get(`/links/${shortCode}/stats`);
    return response.data.data;
  },

  // Delete link
  deleteLink: async (id: string) => {
    await apiClient.delete(`/links/${id}`);
  },
};