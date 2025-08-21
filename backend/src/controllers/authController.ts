import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { successResponse } from '../utils/apiResponse';

const authService = new AuthService();

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, fullName } = req.body;

    const result = await authService.register({
      email,
      password,
      fullName,
    });

    res.status(201).json(
      successResponse(result, 'User registered successfully')
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(
      { email, password },
      ipAddress,
      userAgent
    );

    res.json(successResponse(result, 'Login successful'));
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.token) {
      await authService.logout(req.token);
    }

    res.json(successResponse(null, 'Logout successful'));
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user) {
      await authService.logoutAll(req.user.id);
    }

    res.json(successResponse(null, 'All sessions terminated'));
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    const result = await authService.refreshTokens(refreshToken);

    res.json(successResponse(result, 'Tokens refreshed successfully'));
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.user) {
      throw new Error('User not authenticated');
    }

    await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    res.json(successResponse(null, 'Password changed successfully'));
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    await authService.forgotPassword(email);

    res.json(
      successResponse(
        null,
        'If an account exists with this email, a password reset link has been sent'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    await authService.resetPassword(token, newPassword);

    res.json(successResponse(null, 'Password reset successfully'));
  } catch (error) {
    next(error);
  }
};