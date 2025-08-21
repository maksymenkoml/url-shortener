import prisma from '../config/database';
import { generateShortCode, validateUrl, normalizeUrl, buildShortUrl } from '../utils/urlUtils';
import { CreateLinkDto, LinkResponse } from '../types';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '../utils/apiResponse';

export class LinkService {
  async createShortLink(data: CreateLinkDto): Promise<LinkResponse> {
    const { url, title, description, userId } = data;

    // Validate URL
    if (!validateUrl(url)) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Invalid URL format');
    }

    // Normalize URL
    const normalizedUrl = normalizeUrl(url);

    // Check if URL already exists for anonymous users
    if (!userId) {
      const existingLink = await prisma.link.findFirst({
        where: {
          originalUrl: normalizedUrl,
          userId: null,
          isActive: true,
        },
      });

      if (existingLink) {
        return this.formatLinkResponse(existingLink);
      }
    }

    // Generate unique short code
    let shortCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      shortCode = generateShortCode();
      const exists = await prisma.link.findUnique({
        where: { shortCode },
      });
      if (!exists) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts === maxAttempts) {
      throw new AppError(500, ERROR_CODES.INTERNAL_ERROR, 'Failed to generate unique short code');
    }

    // Create link
    const link = await prisma.link.create({
      data: {
        shortCode,
        originalUrl: normalizedUrl,
        title,
        description,
        userId: userId ? BigInt(userId) : undefined,
      },
    });

    return this.formatLinkResponse(link);
  }

  async getLinkByShortCode(shortCode: string): Promise<LinkResponse | null> {
    const link = await prisma.link.findUnique({
      where: { shortCode },
    });

    if (!link) {
      return null;
    }

    if (!link.isActive) {
      throw new AppError(410, ERROR_CODES.NOT_FOUND, 'This link has been deactivated');
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new AppError(410, ERROR_CODES.NOT_FOUND, 'This link has expired');
    }

    return this.formatLinkResponse(link);
  }

  async getOriginalUrl(shortCode: string): Promise<string | null> {
    const link = await prisma.link.findUnique({
      where: { 
        shortCode,
        isActive: true,
      },
    });

    if (!link) {
      return null;
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      return null;
    }

    // Increment click count (async, don't wait)
    prisma.link.update({
      where: { id: link.id },
      data: {
        clickCount: { increment: 1 },
        lastClickedAt: new Date(),
      },
    }).catch(console.error);

    return link.originalUrl;
  }

  async trackClick(shortCode: string, clickData: any): Promise<void> {
    const link = await prisma.link.findUnique({
      where: { shortCode },
    });

    if (!link) return;

    // Save click data (for analytics)
    await prisma.click.create({
      data: {
        linkId: link.id,
        ipAddress: clickData.ipAddress,
        userAgent: clickData.userAgent,
        referer: clickData.referer,
        // Add more fields as needed
      },
    }).catch(console.error);
  }

  async getUserLinks(userId: string, page: number = 1, limit: number = 20): Promise<{
    links: LinkResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [links, total] = await Promise.all([
      prisma.link.findMany({
        where: {
          userId: BigInt(userId),
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.link.count({
        where: {
          userId: BigInt(userId),
        },
      }),
    ]);

    return {
      links: links.map(link => this.formatLinkResponse(link)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLinkById(linkId: string, userId: string): Promise<LinkResponse | null> {
    const link = await prisma.link.findFirst({
      where: {
        id: BigInt(linkId),
        userId: BigInt(userId),
      },
    });

    if (!link) {
      return null;
    }

    return this.formatLinkResponse(link);
  }

  async updateLink(
    linkId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      isActive?: boolean;
      expiresAt?: Date;
    }
  ): Promise<LinkResponse> {
    const link = await prisma.link.findFirst({
      where: {
        id: BigInt(linkId),
        userId: BigInt(userId),
      },
    });

    if (!link) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Link not found');
    }

    const updatedLink = await prisma.link.update({
      where: {
        id: BigInt(linkId),
      },
      data: {
        title: data.title,
        description: data.description,
        isActive: data.isActive,
        expiresAt: data.expiresAt,
      },
    });

    return this.formatLinkResponse(updatedLink);
  }

  async deleteLink(linkId: string, userId: string): Promise<void> {
    const link = await prisma.link.findFirst({
      where: {
        id: BigInt(linkId),
        userId: BigInt(userId),
      },
    });

    if (!link) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Link not found');
    }

    await prisma.link.delete({
      where: {
        id: BigInt(linkId),
      },
    });
  }

  async getLinkAnalytics(linkId: string, userId: string): Promise<any> {
    const link = await prisma.link.findFirst({
      where: {
        id: BigInt(linkId),
        userId: BigInt(userId),
      },
      include: {
        clicks: {
          orderBy: {
            clickedAt: 'desc',
          },
          take: 100,
        },
      },
    });

    if (!link) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Link not found');
    }

    const clicksByDay = await prisma.click.groupBy({
      by: ['clickedAt'],
      where: {
        linkId: BigInt(linkId),
      },
      _count: true,
    });

    return {
      link: this.formatLinkResponse(link),
      analytics: {
        totalClicks: link.clickCount,
        uniqueClicks: link.uniqueClickCount,
        lastClickedAt: link.lastClickedAt,
        recentClicks: link.clicks.map((click: any) => ({
          id: click.id.toString(),
          ipAddress: click.ipAddress,
          userAgent: click.userAgent,
          referer: click.referer,
          clickedAt: click.clickedAt,
        })),
        clicksByDay,
      },
    };
  }

  async getLinkClicks(linkId: string, userId: string, page: number = 1, limit: number = 50): Promise<{
    clicks: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const link = await prisma.link.findFirst({
      where: {
        id: BigInt(linkId),
        userId: BigInt(userId),
      },
    });

    if (!link) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Link not found');
    }

    const skip = (page - 1) * limit;

    const [clicks, total] = await Promise.all([
      prisma.click.findMany({
        where: {
          linkId: BigInt(linkId),
        },
        orderBy: {
          clickedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.click.count({
        where: {
          linkId: BigInt(linkId),
        },
      }),
    ]);

    return {
      clicks: clicks.map(click => ({
        id: click.id.toString(),
        ipAddress: click.ipAddress,
        userAgent: click.userAgent,
        referer: click.referer,
        clickedAt: click.clickedAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  private formatLinkResponse(link: any): LinkResponse {
    return {
      id: link.id.toString(),
      shortCode: link.shortCode,
      shortUrl: buildShortUrl(link.shortCode),
      originalUrl: link.originalUrl,
      title: link.title,
      description: link.description,
      clickCount: link.clickCount,
      createdAt: link.createdAt,
      isActive: link.isActive,
    };
  }
}