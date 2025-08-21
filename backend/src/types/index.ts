import { Request } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  meta?: {
    timestamp: string;
    version?: string;
    request_id?: string;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export interface CreateLinkDto {
  url: string;
  title?: string;
  description?: string;
  userId?: string;
}

export interface LinkResponse {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title?: string;
  description?: string;
  clickCount: number;
  createdAt: Date;
  isActive: boolean;
}

export interface ClickData {
  linkId: string;
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
  country?: string;
  city?: string;
}