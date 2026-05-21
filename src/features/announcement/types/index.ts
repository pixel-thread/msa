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
  _count: {
    readReceipts: number;
  };
}
