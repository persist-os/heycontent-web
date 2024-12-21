import { YouTubeService } from './youtube';
import { GmailService } from './gmail';
import { getCompletion } from '../openai';

interface ContentInsight {
  type: 'partnership' | 'content' | 'engagement' | 'trend';
  title: string;
  description: string;
  source: 'youtube' | 'gmail' | 'combined';
  confidence: number;
  data: any;
  action?: {
    type: string;
    steps: string[];
    priority: 'high' | 'medium' | 'low';
  };
}

interface AnalysisLine {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  steps: string[];
}

export class ContentAnalysisService {
  private youtubeService: YouTubeService;
  private gmailService: GmailService;

  constructor(accountId: string) {
    this.youtubeService = new YouTubeService(accountId);
    this.gmailService = new GmailService(accountId);
  }

  async getPartnershipInsights(): Promise<ContentInsight[]> {
    // Get partnership emails
    const partnerships = await this.gmailService.getPartnershipEmails({
      maxResults: 100
    });

    // Get YouTube performance data
    const channelId = await this.getChannelId();
    const recentVideos = await this.youtubeService.getContentSuggestions(channelId);

    // Analyze partnerships and content performance together
    const prompt = `Analyze these partnerships and content performance:

Partnership Emails:
${partnerships.map(p => `- ${p.subject} (Value: $${p.analysis.dealValue || 'unknown'}, Type: ${p.analysis.dealType})`).join('\n')}

Recent Content Performance:
${recentVideos.join('\n')}

Provide strategic insights about:
1. Best partnership opportunities based on content alignment
2. Content gaps that could attract better partnerships
3. Potential collaboration opportunities
4. Revenue optimization suggestions
5. Growth strategy recommendations

Format each insight as: Title | Description | Priority (high/medium/low) | Action Steps (comma-separated)`;

    const analysis = await getCompletion([
      { role: 'system', content: 'You are an AI that provides strategic insights for content creators and their partnerships.' },
      { role: 'user', content: prompt }
    ]);

    return analysis.split('\n').map((line: string) => {
      const [title, description, priority, steps] = line.split('|').map((s: string) => s.trim());
      return {
        type: 'partnership',
        title,
        description,
        source: 'combined',
        confidence: 0.85,
        data: {
          partnerships: partnerships.length,
          avgDealValue: partnerships.reduce((sum, p) => sum + (p.analysis.dealValue || 0), 0) / partnerships.length,
          contentAlignment: true
        },
        action: {
          type: 'opportunity',
          steps: steps.split(',').map((s: string) => s.trim()),
          priority: priority as 'high' | 'medium' | 'low'
        }
      };
    });
  }

  async getContentRecommendations(): Promise<ContentInsight[]> {
    const channelId = await this.getChannelId();
    
    // Get recent video performance and comments
    const videoIds = await this.getRecentVideoIds(channelId);
    const videoAnalyses = await Promise.all(
      videoIds.map(id => this.youtubeService.analyzeVideoContent(id))
    );

    // Get partnership context
    const partnerships = await this.gmailService.getPartnershipEmails({
      maxResults: 20
    });

    // Combine analyses for comprehensive recommendations
    const prompt = `Based on this channel's performance and opportunities:

Video Topics: ${videoAnalyses.flatMap(a => a.mainTopics).join(', ')}
Engagement Triggers: ${videoAnalyses.flatMap(a => a.engagementTriggers).join(', ')}
Audience Interests: ${videoAnalyses.flatMap(a => a.audienceReaction.suggestions).join(', ')}
Partnership Opportunities: ${partnerships.map(p => p.analysis.topics).flat().join(', ')}

Provide strategic content recommendations that:
1. Align with current audience interests
2. Capitalize on partnership opportunities
3. Address audience questions/needs
4. Maximize engagement potential
5. Consider trending topics

Format each recommendation as: Title | Description | Priority | Action Steps (comma-separated)`;

    const recommendations = await getCompletion([
      { role: 'system', content: 'You are an AI that provides strategic content recommendations based on comprehensive channel analysis.' },
      { role: 'user', content: prompt }
    ]);

    return recommendations.split('\n').map((line: string) => {
      const [title, description, priority, steps] = line.split('|').map((s: string) => s.trim());
      return {
        type: 'content',
        title,
        description,
        source: 'combined',
        confidence: 0.9,
        data: {
          audienceAlignment: true,
          partnershipPotential: true,
          engagementPotential: 'high'
        },
        action: {
          type: 'content',
          steps: steps.split(',').map((s: string) => s.trim()),
          priority: priority as 'high' | 'medium' | 'low'
        }
      };
    });
  }

  private async getChannelId(): Promise<string> {
    // Implementation to get channel ID from user's YouTube account
    return 'channel-id'; // Replace with actual implementation
  }

  private async getRecentVideoIds(channelId: string): Promise<string[]> {
    const response = await this.youtubeService['youtube'].search.list({
      auth: await this.youtubeService['getAuthorizedClient'](),
      part: ['id'],
      channelId,
      order: 'date',
      type: ['video'],
      maxResults: 10
    });

    return response.data.items
      ?.map(item => item.id?.videoId)
      .filter((id): id is string => !!id) || [];
  }
} 