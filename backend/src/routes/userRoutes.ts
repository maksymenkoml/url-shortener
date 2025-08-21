import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { updateProfileSchema } from '../validations/userValidation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);

// User stats and links
router.get('/stats', userController.getUserStats);
router.get('/links', userController.getUserLinks);

// Account management
router.post('/deactivate', userController.deactivateAccount);
router.delete('/delete', userController.deleteAccount);

export default router;