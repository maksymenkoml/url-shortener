import { Router } from 'express';
import { validate, schemas } from '../middleware/validation';
import { optionalAuthenticate, authenticate } from '../middleware/authMiddleware';
import {
  createShortLink,
  getLinkInfo,
  getLinkStats,
  getUserLinks,
  createUserLink,
  getUserLinkById,
  updateUserLink,
  deleteUserLink,
  getLinkAnalytics,
  getLinkClicks,
} from '../controllers/linkController';

const router = Router();

// Public endpoints with optional authentication
router.post('/shorten', optionalAuthenticate, validate(schemas.createLink), createShortLink);
router.get('/links/:shortCode', getLinkInfo);
router.get('/links/:shortCode/stats', getLinkStats);

// Protected endpoints for authenticated users
router.get('/links', authenticate, getUserLinks);
router.post('/links', authenticate, validate(schemas.createLink), createUserLink);
router.get('/links/:id', authenticate, getUserLinkById);
router.put('/links/:id', authenticate, validate(schemas.updateLink), updateUserLink);
router.delete('/links/:id', authenticate, deleteUserLink);
router.get('/links/:id/analytics', authenticate, getLinkAnalytics);
router.get('/links/:id/clicks', authenticate, getLinkClicks);

export default router;