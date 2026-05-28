export interface LogEntry {
  id: string;
  type: string;
  message: string;
  content: Record<string, unknown>;
  isBackend: boolean;
  createdAt: Date;
}
