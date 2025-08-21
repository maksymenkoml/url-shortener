import { Request, Response, NextFunction } from 'express';
import { sendError, ERROR_CODES } from '../utils/apiResponse';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any[]
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Handle Prisma errors
  if (err.message.includes('P2002')) {
    sendError(
      res,
      ERROR_CODES.CONFLICT,
      'A record with this value already exists',
      409
    );
    return;
  }

  if (err.message.includes('P2025')) {
    sendError(
      res,
      ERROR_CODES.NOT_FOUND,
      'Record not found',
      404
    );
    return;
  }

  // Default error
  sendError(
    res,
    ERROR_CODES.INTERNAL_ERROR,
    process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    500
  );
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};