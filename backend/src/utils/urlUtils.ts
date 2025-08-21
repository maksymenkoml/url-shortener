import { customAlphabet } from 'nanoid';
import { SHORT_CODE_LENGTH, MAX_URL_LENGTH, MIN_URL_LENGTH } from '../config/constants';

// Alphabet without confusing characters (0, O, I, l)
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const generateNanoId = customAlphabet(alphabet, SHORT_CODE_LENGTH);

export const generateShortCode = (): string => {
  return generateNanoId();
};

export const validateUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  if (url.length < MIN_URL_LENGTH || url.length > MAX_URL_LENGTH) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

export const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Remove trailing slash if it's just the domain
    if (urlObj.pathname === '/') {
      return urlObj.origin;
    }
    return urlObj.toString();
  } catch {
    return url;
  }
};

export const buildShortUrl = (shortCode: string): string => {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  return `${baseUrl}/${shortCode}`;
};