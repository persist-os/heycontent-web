import { YOUTUBE_CONFIG } from '../config/youtube';

export type ValidSentiment = 'positive' | 'negative' | 'neutral';

export interface YoutubeMetrics {
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
}

interface YouTubeMetadata {
  channelId: string;
  subscribers?: string;
  videos?: string;
  views?: string;
}


export interface CommentAnalysis {
  sentiment: ValidSentiment;
  topics: string[];
  isQuestion: boolean;
  isEngaging: boolean;
  suggestedAction?: string;
}

export interface CommentAnalysisResponse {
  sentiment: string;
  topics: unknown;
  isQuestion: unknown;
  isEngaging: unknown;
  suggestedAction?: unknown;
}

export interface ContentSuggestion {
  suggestion: string;
  relevance: number;
  targetAudience?: string;
  estimatedEngagement?: number;
}

export const DEFAULT_COMMENT_ANALYSIS: CommentAnalysis = {
  sentiment: 'neutral',
  topics: [],
  isQuestion: false,
  isEngaging: false
} as const; 