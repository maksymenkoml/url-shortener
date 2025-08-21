import { Router } from 'express';
import { validate, schemas } from '../middleware/validation';
import { optionalAuthenticate } from '../middleware/authMiddleware';
import {
  createShortLink,
  getLinkInfo,
  getLinkStats,
} from '../controllers/linkController';

const router = Router();

// Public endpoints with optional authentication
router.post('/shorten', optionalAuthenticate, validate(schemas.createLink), createShortLink);
router.get('/links/:shortCode', getLinkInfo);
router.get('/links/:shortCode/stats', getLinkStats);

export default router;