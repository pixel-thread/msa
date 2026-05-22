export interface Announcement {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  imageUrl: string | null;
  status: string;
  priority: string;
  isPinned: boolean;
  publishedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    imageUrl: string | null;
  };
  imageFile: {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  } | null;
  _count: {
    readReceipts: number;
  };
}
