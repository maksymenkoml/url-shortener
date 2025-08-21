import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwtUtils';
import { AppError } from './errorHandler';
import { ERROR_CODES } from '../utils/apiResponse';
import prisma from '../config/database';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    // Verify token
    verifyAccessToken(token);
    
    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid session');
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({
        where: { id: session.id },
      });
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Session has expired');
    }

    // Check if user is active
    if (!session.user.isActive) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Account has been deactivated');
    }

    // Attach user to request
    req.user = {
      id: session.user.id.toString(),
      email: session.user.email,
    };
    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // If no authorization header, continue without user
    if (!req.headers.authorization) {
      return next();
    }

    // Try to authenticate
    const token = extractTokenFromHeader(req.headers.authorization);
    verifyAccessToken(token);

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (session && session.expiresAt > new Date() && session.user.isActive) {
      req.user = {
        id: session.user.id.toString(),
        email: session.user.email,
      };
      req.token = token;
    }

    next();
  } catch {
    // If authentication fails, continue without user
    next();
  }
};