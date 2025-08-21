export const SHORT_CODE_LENGTH = 6;
export const URL_CACHE_TTL = 3600; // 1 hour in seconds
export const MAX_URL_LENGTH = 2048;
export const MIN_URL_LENGTH = 10;

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const CORS_OPTIONS = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
};

export const RATE_LIMIT = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};