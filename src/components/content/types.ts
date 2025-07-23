export interface YouTubeAIAnalysis {
  performanceScore?: number;
  performanceScoreExplanation?: string;
  contentType?: string;
  mainTopics?: string[];
  overallSentiment?: number;
  overallSentimentExplanation?: string;
  commentSectionScore?: number;
  commentSectionScoreExplanation?: string;
  comment_keyTakeaways?: string[];
  comment_commonReactions?: string[];
  narrativeScore?: number;
  narrativeScoreExplanation?: string;
  emotionalJourney?: string;
  pacingAndFlow?: string;
  engagementTriggers?: string[];
  narrativeImprovements?: string;
  engagementEnhancements?: string;
  cognitiveFlowOptimizations?: string;
  uniqueStrengths?: string[];
  growthVectors?: string[];
  recommendedTopics?: string[];
  potentialTitles?: string[];
  audienceConnection?: string;
  innovationOpportunities?: string;
}

export interface YouTubeAnalysis {
  aiAnalysis?: YouTubeAIAnalysis;
}

export interface YouTubeVideoData {
  analysis?: YouTubeAnalysis;
  snippet?: {
    title?: string;
    thumbnails?: {
      high?: string;
      medium?: string;
    };
    published_at?: string;
    tags?: string[];
  };
  statistics?: {
    views?: number;
    likes?: number;
    comments?: number;
  };
  content_details?: {
    duration?: string;
  };
  comments?: {
    comments?: Array<{
      id: string;
      text: string;
      author?: {
        display_name?: string;
        profile_image?: string;
      };
      published_at?: string;
      likes?: number;
    }>;
  };
  captions?: {
    caption_track?: {
      text?: string;
      language?: string;
    };
  };
}

export interface YouTubeAnalysisCardsProps {
  videoData: YouTubeVideoData;
  isGeneratingAnalysis: boolean;
  analysisError: string | null;
}

export interface YouTubeCardProps {
  analysis: YouTubeAIAnalysis;
} 