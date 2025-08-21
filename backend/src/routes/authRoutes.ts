import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/authValidation';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;