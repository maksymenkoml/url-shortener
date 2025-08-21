import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '../utils/apiResponse';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '../utils/jwtUtils';

interface RegisterDto {
  email: string;
  password: string;
  fullName?: string;
}

interface LoginDto {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private readonly SALT_ROUNDS = 10;

  async register(data: RegisterDto): Promise<AuthResponse> {
    const { email, password, fullName } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(409, ERROR_CODES.CONFLICT, 'User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
      },
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id.toString(),
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Create session
    await this.createSession(user.id, accessToken, refreshToken);

    return {
      user: {
        id: user.id.toString(),
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id.toString(),
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Create session
    await this.createSession(user.id, accessToken, refreshToken, ipAddress, userAgent);

    return {
      user: {
        id: user.id.toString(),
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  async logout(token: string): Promise<void> {
    // Delete session by token
    await prisma.session.deleteMany({
      where: { token },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    // Delete all sessions for user
    await prisma.session.deleteMany({
      where: { userId: BigInt(userId) },
    });
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    // Verify refresh token
    verifyRefreshToken(refreshToken);

    // Find session
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid refresh token');
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({
        where: { id: session.id },
      });
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Session has expired');
    }

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: session.user.id.toString(),
      email: session.user.email,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: {
        id: session.user.id.toString(),
        email: session.user.email,
        fullName: session.user.fullName,
        emailVerified: session.user.emailVerified,
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all sessions
    await this.logoutAll(userId);
  }

  async forgotPassword(email: string): Promise<void> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // TODO: Send email with reset link containing resetToken
    // For now, just log it
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!passwordReset) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: passwordReset.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true },
      }),
    ]);

    // Invalidate all sessions
    await this.logoutAll(passwordReset.userId.toString());
  }

  private async createSession(
    userId: bigint,
    token: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await prisma.session.create({
      data: {
        userId,
        token,
        refreshToken,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }
}