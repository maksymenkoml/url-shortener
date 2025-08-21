import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '../utils/apiResponse';
import { Prisma } from '@prisma/client';

interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

interface UserStats {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
}

interface UpdateProfileDto {
  fullName?: string;
  email?: string;
}

export class UserService {
  async getUserById(userId: string): Promise<UserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      return null;
    }

    return this.formatUserProfile(user);
  }

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return this.formatUserProfile(user);
  }

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<UserProfile> {
    // Check if email is being changed
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id: BigInt(userId) },
        },
      });

      if (existingUser) {
        throw new AppError(409, ERROR_CODES.CONFLICT, 'Email is already in use');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: BigInt(userId) },
      data: {
        fullName: data.fullName,
        email: data.email,
        emailVerified: data.email ? false : undefined, // Reset verification if email changes
      },
    });

    return this.formatUserProfile(updatedUser);
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const userIdBigInt = BigInt(userId);

    // Get link statistics
    const [totalLinks, activeLinks, totalClicks] = await Promise.all([
      prisma.link.count({
        where: { userId: userIdBigInt },
      }),
      prisma.link.count({
        where: {
          userId: userIdBigInt,
          isActive: true,
        },
      }),
      prisma.link.aggregate({
        where: { userId: userIdBigInt },
        _sum: { clickCount: true },
      }),
    ]);

    return {
      totalLinks,
      activeLinks,
      totalClicks: totalClicks._sum.clickCount || 0,
    };
  }

  async getUserLinks(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'clickCount';
      order?: 'asc' | 'desc';
      isActive?: boolean;
    } = {}
  ) {
    const {
      limit = 10,
      offset = 0,
      orderBy = 'createdAt',
      order = 'desc',
      isActive,
    } = options;

    const where: Prisma.LinkWhereInput = {
      userId: BigInt(userId),
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [links, total] = await Promise.all([
      prisma.link.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [orderBy]: order },
      }),
      prisma.link.count({ where }),
    ]);

    return {
      links: links.map(link => ({
        id: link.id.toString(),
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        title: link.title,
        description: link.description,
        clickCount: link.clickCount,
        isActive: link.isActive,
        expiresAt: link.expiresAt,
        createdAt: link.createdAt,
        lastClickedAt: link.lastClickedAt,
      })),
      total,
      limit,
      offset,
    };
  }

  async deleteAccount(userId: string): Promise<void> {
    // This will cascade delete all related data (links, clicks, sessions, etc.)
    await prisma.user.delete({
      where: { id: BigInt(userId) },
    });
  }

  async deactivateAccount(userId: string): Promise<void> {
    await prisma.$transaction([
      // Deactivate user
      prisma.user.update({
        where: { id: BigInt(userId) },
        data: { isActive: false },
      }),
      // Delete all sessions
      prisma.session.deleteMany({
        where: { userId: BigInt(userId) },
      }),
      // Deactivate all links
      prisma.link.updateMany({
        where: { userId: BigInt(userId) },
        data: { isActive: false },
      }),
    ]);
  }

  async reactivateAccount(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: BigInt(userId) },
      data: { isActive: true },
    });
  }

  async verifyEmail(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: BigInt(userId) },
      data: { emailVerified: true },
    });
  }

  private formatUserProfile(user: any): UserProfile {
    return {
      id: user.id.toString(),
      email: user.email,
      fullName: user.fullName,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}