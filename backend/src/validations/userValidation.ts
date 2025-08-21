import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  fullName: Joi.string()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Full name cannot exceed 255 characters',
    }),
  email: Joi.string()
    .email()
    .max(255)
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email cannot exceed 255 characters',
    }),
});