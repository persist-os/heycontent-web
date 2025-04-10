import { IntentProcessor, ProcessingResult } from '../types';
import { ChatAgentContext } from '../chat-agent';
import { YouTubeMemoryManagerImpl } from '../../memory/youtube-memory-manager';
import { YouTubeService } from '@/app/lib/services/youtube';

export class VideoProcessor implements IntentProcessor {
  type = 'social_media' as const;
  confidence: number = 0.9;
  private youtubeMemoryManager: YouTubeMemoryManagerImpl;
  private youtubeService: YouTubeService;

  constructor(
    userId: string,
    youtubeMemoryManager: YouTubeMemoryManagerImpl
  ) {
    this.youtubeMemoryManager = youtubeMemoryManager;
    this.youtubeService = new YouTubeService(userId, youtubeMemoryManager.getRag());
  }

  subProcessors = {
    'video_analysis': async (input: string, context: ChatAgentContext): Promise<ProcessingResult> => {
      try {
        // Extract time-related keywords
        const timeMatch = input.match(/last (week|month|year)|this (week|month|year)|(\d+) (days?|weeks?|months?|years?) ago/i);
        const startDate = timeMatch ? this.getDateFromTimeKeyword(timeMatch[0]) : undefined;

        // Check memory first
        const memoryResults = await this.youtubeMemoryManager.findRelevantVideos(
          input,
          JSON.stringify(context)
        );

        if (memoryResults.confidence > 0.8 && !memoryResults.needsRefresh) {
          return {
            response: this.formatMemoryResponse(memoryResults),
            confidence: memoryResults.confidence,
            metadata: {
              source: 'memory',
              timestamp: Date.now(),
              processingTime: 0
            }
          };
        }

        // Perform live search
        const searchResults = await this.youtubeService.searchVideosByTitle(input, {
          includeMetrics: true,
          includeAnalysis: true,
          startDate,
          maxResults: 5
        });

        if (!searchResults || searchResults.length === 0) {
          return {
            response: 'No videos found matching your query.',
            confidence: 0.5,
            metadata: {
              source: 'live_search',
              timestamp: Date.now(),
              processingTime: 0
            }
          };
        }

        // Store results in memory
        await Promise.all(searchResults.map(video => 
          this.youtubeMemoryManager.storeVideo(
            video.id,
            video.metrics,
            JSON.stringify(context)
          )
        ));

        return {
          response: this.formatSearchResponse(searchResults),
          confidence: 0.9,
          metadata: {
            source: 'live_search',
            timestamp: Date.now(),
            processingTime: 0
          },
          actions: [{
            type: 'update_video_context',
            data: searchResults
          }]
        };

      } catch (error) {
        console.error('Error in video analysis processor:', error);
        return {
          response: 'Sorry, there was an error analyzing the videos.',
          confidence: 0,
          metadata: {
            source: 'error',
            timestamp: Date.now(),
            processingTime: 0
          }
        };
      }
    }
  };

  requirements = {
    services: ['youtube'],
    permissions: ['read_analytics'],
    data: ['video_metrics']
  };

  private getDateFromTimeKeyword(keyword: string): Date {
    const now = new Date();
    const match = keyword.match(/(last|this) (week|month|year)|(\d+) (days?|weeks?|months?|years?) ago/i);
    
    if (!match) return now;
    
    if (match[1]) { // "last" or "this"
      const period = match[2];
      const isLast = match[1].toLowerCase() === 'last';
      
      switch (period) {
        case 'week':
          now.setDate(now.getDate() - (isLast ? 7 : 0));
          break;
        case 'month':
          now.setMonth(now.getMonth() - (isLast ? 1 : 0));
          break;
        case 'year':
          now.setFullYear(now.getFullYear() - (isLast ? 1 : 0));
          break;
      }
    } else { // "X days/weeks/months/years ago"
      const amount = parseInt(match[3]);
      const unit = match[4].toLowerCase();
      
      switch (unit) {
        case 'day':
        case 'days':
          now.setDate(now.getDate() - amount);
          break;
        case 'week':
        case 'weeks':
          now.setDate(now.getDate() - (amount * 7));
          break;
        case 'month':
        case 'months':
          now.setMonth(now.getMonth() - amount);
          break;
        case 'year':
        case 'years':
          now.setFullYear(now.getFullYear() - amount);
          break;
      }
    }
    
    return now;
  }

  private formatMemoryResponse(memoryResults: any): string {
    return `Based on my memory, here's what I found:\n\n${
      memoryResults.nodes.map((node: any) => 
        `- ${node.content.title}\n  Views: ${node.content.metrics.views}\n  Engagement: ${node.content.metrics.engagement.rate}%`
      ).join('\n\n')
    }`;
  }

  private formatSearchResponse(searchResults: any[]): string {
    return `Here are the relevant videos:\n\n${
      searchResults.map(video => 
        `- ${video.title}\n  Views: ${video.metrics.views}\n  Engagement: ${video.metrics.engagement.rate}%`
      ).join('\n\n')
    }`;
  }
} 