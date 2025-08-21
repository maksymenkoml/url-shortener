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
    userId: req.user?.id,
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

// Protected endpoints for authenticated users
export const getUserLinks = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const result = await linkService.getUserLinks(req.user!.id, page, limit);
  sendSuccess(res, result);
});

export const createUserLink = asyncHandler(async (req: Request, res: Response) => {
  const { url, title, description } = req.body;
  
  const link = await linkService.createShortLink({
    url,
    title,
    description,
    userId: req.user!.id,
  });

  sendSuccess(res, link, 201);
});

export const getUserLinkById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const link = await linkService.getLinkById(id, req.user!.id);
  
  if (!link) {
    sendError(res, ERROR_CODES.NOT_FOUND, 'Link not found', 404);
    return;
  }

  sendSuccess(res, link);
});

export const updateUserLink = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, isActive, expiresAt } = req.body;
  
  const link = await linkService.updateLink(
    id, 
    req.user!.id,
    { title, description, isActive, expiresAt }
  );

  sendSuccess(res, link);
});

export const deleteUserLink = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  await linkService.deleteLink(id, req.user!.id);
  
  sendSuccess(res, { message: 'Link deleted successfully' });
});

export const getLinkAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const analytics = await linkService.getLinkAnalytics(id, req.user!.id);
  
  sendSuccess(res, analytics);
});

export const getLinkClicks = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  
  const result = await linkService.getLinkClicks(id, req.user!.id, page, limit);
  
  sendSuccess(res, result);
});