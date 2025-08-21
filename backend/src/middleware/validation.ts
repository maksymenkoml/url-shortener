import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { sendError, ERROR_CODES } from '../utils/apiResponse';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      sendError(
        res,
        ERROR_CODES.VALIDATION_ERROR,
        'Validation failed',
        400,
        details
      );
      return;
    }
    
    next();
  };
};

// Validation schemas
export const schemas = {
  createLink: Joi.object({
    url: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .required()
      .messages({
        'string.uri': 'Must be a valid HTTP/HTTPS URL',
        'any.required': 'URL is required',
      }),
    title: Joi.string().max(255).optional(),
    description: Joi.string().max(1000).optional(),
  }),
  
  updateLink: Joi.object({
    originalUrl: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .optional(),
    title: Joi.string().max(255).optional(),
    description: Joi.string().max(1000).optional(),
    isActive: Joi.boolean().optional(),
  }),
};