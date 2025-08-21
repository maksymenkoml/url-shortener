import { Router } from 'express';
import { validate, schemas } from '../middleware/validation';
import {
  createShortLink,
  getLinkInfo,
  getLinkStats,
} from '../controllers/linkController';

const router = Router();

// Public endpoints
router.post('/shorten', validate(schemas.createLink), createShortLink);
router.get('/links/:shortCode', getLinkInfo);
router.get('/links/:shortCode/stats', getLinkStats);

export default router;