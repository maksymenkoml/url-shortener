import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '../utils/apiResponse';

const userService = new UserService();

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'User not authenticated');
    }

    const profile = await userService.getUserById(req.user.id);

    if (!profile) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');
    }

    res.json(successResponse(profile));
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'User not authenticated');
    }

    const { fullName, email } = req.body;

    const updatedProfile = await userService.updateProfile(req.user.id, {
      fullName,
      email,
    });

    res.json(successResponse(updatedProfile, 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'User not authenticated');
    }

    const stats = await userService.getUserStats(req.user.id);

    res.json(successResponse(stats));
  } catch (error) {
    next(error);
  }
};

export const getUserLinks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'User not authenticated');
    }

    const {
      limit = '10',
      offset = '0',
      orderBy = 'createdAt',
      order = 'desc',
      isActive,
    } = req.query;

    const links = await userService.getUserLinks(req.user.id, {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      orderBy: orderBy as 'createdAt' | 'clickCount',
      order: order as 'asc' | 'desc',
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    res.json(successResponse(links));
  } catch (error) {
    next(error);
  }
};

export const deactivateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'User not authenticated');
    }

    await userService.deactivateAccount(req.user.id);

    res.json(successResponse(null, 'Account deactivated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'User not authenticated');
    }

    await userService.deleteAccount(req.user.id);

    res.json(successResponse(null, 'Account deleted successfully'));
  } catch (error) {
    next(error);
  }
};