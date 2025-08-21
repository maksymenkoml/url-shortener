import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from './apiResponse';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid token');
    }
    throw new AppError(500, ERROR_CODES.INTERNAL_ERROR, 'Token verification failed');
  }
};

export const verifyRefreshToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as DecodedToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid refresh token');
    }
    throw new AppError(500, ERROR_CODES.INTERNAL_ERROR, 'Refresh token verification failed');
  }
};

export const extractTokenFromHeader = (authHeader: string | undefined): string => {
  if (!authHeader) {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'No authorization header');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid authorization header format');
  }

  return parts[1];
};