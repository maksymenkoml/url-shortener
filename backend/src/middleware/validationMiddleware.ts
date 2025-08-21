import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';
import { ERROR_CODES } from '../utils/apiResponse';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'Validation failed',
        details
      );
    }

    req.body = value;
    next();
  };
};