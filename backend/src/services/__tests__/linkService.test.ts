// Mock dependencies BEFORE imports
import { mockPrismaClient, resetMocks } from '../../test/mocks/prisma';
jest.mock('../../config/database', () => mockPrismaClient);
jest.mock('../../utils/urlUtils');
jest.mock('nanoid', () => ({
  customAlphabet: jest.fn(() => jest.fn(() => 'abc123')),
}));

// Now import the actual modules
import { LinkService } from '../linkService';
import { AppError } from '../../middleware/errorHandler';
import * as urlUtils from '../../utils/urlUtils';

describe('LinkService', () => {
  let linkService: LinkService;

  beforeEach(() => {
    linkService = new LinkService();
    resetMocks();
    jest.clearAllMocks();
  });

  describe('createShortLink', () => {
    it('should create a short link for valid URL', async () => {
      (urlUtils.validateUrl as jest.Mock).mockReturnValue(true);
      (urlUtils.normalizeUrl as jest.Mock).mockReturnValue('https://example.com');
      (urlUtils.generateShortCode as jest.Mock).mockReturnValue('abc123');
      (urlUtils.buildShortUrl as jest.Mock).mockReturnValue('http://localhost:3000/abc123');

      mockPrismaClient.link.findFirst.mockResolvedValue(null);
      mockPrismaClient.link.findUnique.mockResolvedValue(null);
      mockPrismaClient.link.create.mockResolvedValue({
        id: BigInt(1),
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
        title: 'Test Link',
        description: null,
        userId: null,
        clickCount: 0,
        uniqueClickCount: 0,
        isActive: true,
        expiresAt: null,
        lastClickedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await linkService.createShortLink({
        url: 'https://example.com',
        title: 'Test Link',
      });

      expect(result).toMatchObject({
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
        title: 'Test Link',
      });
      expect(mockPrismaClient.link.create).toHaveBeenCalled();
    });

    it('should throw error for invalid URL', async () => {
      (urlUtils.validateUrl as jest.Mock).mockReturnValue(false);

      await expect(
        linkService.createShortLink({
          url: 'invalid-url',
        })
      ).rejects.toThrow(AppError);
    });

    it('should return existing link for duplicate anonymous URL', async () => {
      (urlUtils.validateUrl as jest.Mock).mockReturnValue(true);
      (urlUtils.normalizeUrl as jest.Mock).mockReturnValue('https://example.com');
      (urlUtils.buildShortUrl as jest.Mock).mockReturnValue('http://localhost:3000/abc123');

      const existingLink = {
        id: BigInt(1),
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
        title: null,
        description: null,
        userId: null,
        clickCount: 5,
        uniqueClickCount: 3,
        isActive: true,
        expiresAt: null,
        lastClickedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.link.findFirst.mockResolvedValue(existingLink);

      const result = await linkService.createShortLink({
        url: 'https://example.com',
      });

      expect(result.id).toBe('1');
      expect(mockPrismaClient.link.create).not.toHaveBeenCalled();
    });

    it('should handle collision in short code generation', async () => {
      (urlUtils.validateUrl as jest.Mock).mockReturnValue(true);
      (urlUtils.normalizeUrl as jest.Mock).mockReturnValue('https://example.com');
      (urlUtils.generateShortCode as jest.Mock)
        .mockReturnValueOnce('abc123')
        .mockReturnValueOnce('def456');
      (urlUtils.buildShortUrl as jest.Mock).mockReturnValue('http://localhost:3000/def456');

      mockPrismaClient.link.findFirst.mockResolvedValue(null);
      mockPrismaClient.link.findUnique
        .mockResolvedValueOnce({ id: BigInt(1), shortCode: 'abc123' }) // First code exists
        .mockResolvedValueOnce(null); // Second code doesn't exist

      mockPrismaClient.link.create.mockResolvedValue({
        id: BigInt(2),
        shortCode: 'def456',
        originalUrl: 'https://example.com',
        title: null,
        description: null,
        userId: null,
        clickCount: 0,
        uniqueClickCount: 0,
        isActive: true,
        expiresAt: null,
        lastClickedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await linkService.createShortLink({
        url: 'https://example.com',
      });

      expect(result.shortCode).toBe('def456');
      expect(urlUtils.generateShortCode).toHaveBeenCalledTimes(2);
    });
  });

  describe('getLinkByShortCode', () => {
    it('should return link for valid short code', async () => {
      (urlUtils.buildShortUrl as jest.Mock).mockReturnValue('http://localhost:3000/abc123');

      const link = {
        id: BigInt(1),
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
        title: null,
        description: null,
        userId: null,
        clickCount: 0,
        uniqueClickCount: 0,
        isActive: true,
        expiresAt: null,
        lastClickedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.link.findUnique.mockResolvedValue(link);

      const result = await linkService.getLinkByShortCode('abc123');

      expect(result).toMatchObject({
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
      });
    });

    it('should return null for non-existent short code', async () => {
      mockPrismaClient.link.findUnique.mockResolvedValue(null);

      const result = await linkService.getLinkByShortCode('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error for inactive link', async () => {
      const link = {
        id: BigInt(1),
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
        isActive: false,
        expiresAt: null,
      };

      mockPrismaClient.link.findUnique.mockResolvedValue(link);

      await expect(
        linkService.getLinkByShortCode('abc123')
      ).rejects.toThrow(AppError);
    });

    it('should throw error for expired link', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const link = {
        id: BigInt(1),
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
        isActive: true,
        expiresAt: pastDate,
      };

      mockPrismaClient.link.findUnique.mockResolvedValue(link);

      await expect(
        linkService.getLinkByShortCode('abc123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('getOriginalUrl', () => {
    it('should return original URL', async () => {
      const link = {
        id: BigInt(1),
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
        isActive: true,
        expiresAt: null,
      };

      mockPrismaClient.link.findUnique.mockResolvedValue(link);
      mockPrismaClient.link.update.mockResolvedValue({} as any);

      const url = await linkService.getOriginalUrl('abc123');

      expect(url).toBe('https://example.com');
      expect(mockPrismaClient.link.update).toHaveBeenCalled();
    });

    it('should return null for inactive link', async () => {
      mockPrismaClient.link.findUnique.mockResolvedValue(null);

      const url = await linkService.getOriginalUrl('abc123');

      expect(url).toBeNull();
    });
  });

  describe('getUserLinks', () => {
    it('should return paginated links for user', async () => {
      (urlUtils.buildShortUrl as jest.Mock).mockReturnValue('http://localhost:3000/abc123');

      const links = [
        {
          id: BigInt(1),
          shortCode: 'abc123',
          originalUrl: 'https://example1.com',
          title: null,
          description: null,
          clickCount: 0,
          isActive: true,
          expiresAt: null,
          createdAt: new Date(),
          lastClickedAt: null,
        },
        {
          id: BigInt(2),
          shortCode: 'def456',
          originalUrl: 'https://example2.com',
          title: null,
          description: null,
          clickCount: 0,
          isActive: true,
          expiresAt: null,
          createdAt: new Date(),
          lastClickedAt: null,
        },
      ];

      mockPrismaClient.link.findMany.mockResolvedValue(links);
      mockPrismaClient.link.count.mockResolvedValue(3);

      const result = await linkService.getUserLinks('1', 1, 2);

      expect(result.links).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(2);
    });
  });

  describe('updateLink', () => {
    it('should update link fields', async () => {
      (urlUtils.buildShortUrl as jest.Mock).mockReturnValue('http://localhost:3000/abc123');

      const existingLink = {
        id: BigInt(1),
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
        userId: BigInt(1),
      };

      const updatedLink = {
        ...existingLink,
        title: 'Updated Title',
        description: 'Updated Description',
        clickCount: 0,
        isActive: true,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastClickedAt: null,
        uniqueClickCount: 0,
      };

      mockPrismaClient.link.findFirst.mockResolvedValue(existingLink);
      mockPrismaClient.link.update.mockResolvedValue(updatedLink);

      const result = await linkService.updateLink('1', '1', {
        title: 'Updated Title',
        description: 'Updated Description',
      });

      expect(result.title).toBe('Updated Title');
      expect(result.description).toBe('Updated Description');
    });

    it('should throw error when updating non-existent link', async () => {
      mockPrismaClient.link.findFirst.mockResolvedValue(null);

      await expect(
        linkService.updateLink('999', '1', {
          title: 'Updated',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('deleteLink', () => {
    it('should delete link', async () => {
      const link = {
        id: BigInt(1),
        userId: BigInt(1),
      };

      mockPrismaClient.link.findFirst.mockResolvedValue(link);
      mockPrismaClient.link.delete.mockResolvedValue({} as any);

      await linkService.deleteLink('1', '1');

      expect(mockPrismaClient.link.delete).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
    });

    it('should throw error when deleting non-existent link', async () => {
      mockPrismaClient.link.findFirst.mockResolvedValue(null);

      await expect(
        linkService.deleteLink('999', '1')
      ).rejects.toThrow(AppError);
    });
  });

  describe('trackClick', () => {
    it('should track click data', async () => {
      const link = {
        id: BigInt(1),
        shortCode: 'abc123',
      };

      mockPrismaClient.link.findUnique.mockResolvedValue(link);
      mockPrismaClient.click.create.mockResolvedValue({} as any);

      await linkService.trackClick('abc123', {
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        referer: 'https://google.com',
      });

      expect(mockPrismaClient.click.create).toHaveBeenCalled();
    });
  });
});
