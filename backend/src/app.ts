import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { API_PREFIX, CORS_OPTIONS, RATE_LIMIT } from './config/constants';
import { errorHandler } from './middleware/errorHandler';
import linkRoutes from './routes/linkRoutes';
import { redirectToOriginalUrl } from './controllers/linkController';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors(CORS_OPTIONS));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Rate limiting for API routes
const apiLimiter = rateLimit(RATE_LIMIT);
app.use(API_PREFIX, apiLimiter);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Redirect route (must be before API routes)
app.get('/:shortCode', redirectToOriginalUrl);

// API routes
app.use(API_PREFIX, linkRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;