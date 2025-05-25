export interface DocumentInterface {
  content: string;
  metadata?: Record<string, unknown>;
  id?: string;
  score?: number;
} 