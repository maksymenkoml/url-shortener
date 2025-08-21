import { Request, Response } from 'express';
import { LinkService } from '../services/linkService';
import { sendSuccess, sendError, ERROR_CODES } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/errorHandler';

const linkService = new LinkService();

export const createShortLink = asyncHandler(async (req: Request, res: Response) => {
  const { url, title, description } = req.body;
  
  const link = await linkService.createShortLink({
    url,
    title,
    description,
    // userId will be added when we implement auth
  });

  sendSuccess(res, link, 201);
});

export const getLinkInfo = asyncHandler(async (req: Request, res: Response) => {
  const { shortCode } = req.params;
  
  const link = await linkService.getLinkByShortCode(shortCode);
  
  if (!link) {
    sendError(res, ERROR_CODES.NOT_FOUND, 'Link not found', 404);
    return;
  }

  sendSuccess(res, link);
});

export const redirectToOriginalUrl = asyncHandler(async (req: Request, res: Response) => {
  const { shortCode } = req.params;
  
  const originalUrl = await linkService.getOriginalUrl(shortCode);
  
  if (!originalUrl) {
    sendError(res, ERROR_CODES.NOT_FOUND, 'Link not found or expired', 404);
    return;
  }

  // Track click asynchronously
  linkService.trackClick(shortCode, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    referer: req.get('referer'),
  }).catch(console.error);

  // Redirect to original URL
  res.redirect(301, originalUrl);
});

export const getLinkStats = asyncHandler(async (req: Request, res: Response) => {
  const { shortCode } = req.params;
  
  const link = await linkService.getLinkByShortCode(shortCode);
  
  if (!link) {
    sendError(res, ERROR_CODES.NOT_FOUND, 'Link not found', 404);
    return;
  }

  // For MVP, return basic stats
  const stats = {
    shortCode: link.shortCode,
    clickCount: link.clickCount,
    createdAt: link.createdAt,
    // More detailed stats will be added later
  };

  sendSuccess(res, stats);
});