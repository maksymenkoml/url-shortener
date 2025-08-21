export type Link = {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title?: string;
  description?: string;
  clickCount: number;
  createdAt: string;
  isActive: boolean;
}

export type CreateLinkRequest = {
  url: string;
  title?: string;
  description?: string;
}