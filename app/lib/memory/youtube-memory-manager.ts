import { 
  YouTubeMemoryManager, 
  YouTubeMemoryNode, 
  YouTubeMemorySearchResult,
  MemoryNode
} from './types';
import { YouTubeMetrics } from '../../lib/types/social';
import { AdvancedMemorySystem } from './advanced-memory-system';
import { nanoid } from 'nanoid';

interface VideoContext {
  videoId: string;
  analysis: {
    mainTopics: string[];
    contentType: string[];
    performanceInsights: string[];
    audienceRetention?: number;
    engagementPatterns?: string[];
  };
  lastAccessed: number;
  accessCount: number;
}

export class YouTubeMemoryManagerImpl implements YouTubeMemoryManager {
  private memorySystem: AdvancedMemorySystem;
  private videoContextCache: Map<string, VideoContext>;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(memorySystem: AdvancedMemorySystem) {
    this.memorySystem = memorySystem;
    this.videoContextCache = new Map();
  }

  async storeVideo(videoId: string, metrics: YouTubeMetrics, context: string): Promise<void> {
    // Create and store the video node
    const videoNode = await this.createEnhancedVideoNode(videoId, metrics, context);
    await this.memorySystem.addNode(videoNode);
    
    // Update video context
    await this.updateVideoContext(videoId, metrics);
    
    // Create relationships with other content
    await this.createVideoRelationships(videoNode);
  }

  async findRelevantVideos(query: string, context: string): Promise<YouTubeMemorySearchResult> {
    const nodes = await this.memorySystem.searchNodes({
      type: 'youtube_video',
      query: query,
      context: context
    });

    const videoNodes = nodes.filter((node): node is YouTubeMemoryNode => 
      node.type === 'youtube_video'
    );

    const needsRefresh = this.needsRefresh(videoNodes);
    const confidence = this.calculateConfidence(videoNodes, query);

    return {
      nodes: videoNodes,
      confidence,
      needsRefresh
    };
  }

  async getVideoInsights(videoId: string): Promise<string[]> {
    const nodes = await this.memorySystem.searchNodes({
      type: 'youtube_video',
      query: videoId
    });

    const videoNode = nodes.find((node): node is YouTubeMemoryNode => 
      node.type === 'youtube_video' && 
      typeof node.content === 'object' &&
      node.content !== null &&
      'videoId' in node.content &&
      node.content.videoId === videoId
    );

    if (!videoNode) return [];

    return [
      ...videoNode.content.key_points,
      ...videoNode.content.analysis.performanceInsights
    ];
  }

  async updateVideoReference(videoId: string): Promise<void> {
    const nodes = await this.memorySystem.searchNodes({
      type: 'youtube_video',
      query: videoId
    });

    const videoNode = nodes.find((node): node is YouTubeMemoryNode => 
      node.type === 'youtube_video' && 
      typeof node.content === 'object' &&
      node.content !== null &&
      'videoId' in node.content &&
      node.content.videoId === videoId
    );

    if (videoNode) {
      videoNode.content.lastReferencedAt = Date.now();
      videoNode.content.useCount++;
      await this.memorySystem.updateNode(videoNode);

      // Update video context if available
      const videoContext = this.videoContextCache.get(videoId);
      if (videoContext) {
        videoContext.lastAccessed = Date.now();
        videoContext.accessCount++;
        this.videoContextCache.set(videoId, videoContext);
      }
    }
  }

  async analyzeVideoTrends(timeframe: string): Promise<{
    topPerforming: YouTubeMemoryNode[];
    trends: {
      views: number[];
      engagement: number[];
      topics: { topic: string; count: number }[];
    };
  }> {
    const nodes = await this.memorySystem.searchNodes({
      type: 'youtube_video',
      query: ''
    });

    const videoNodes = nodes.filter((node): node is YouTubeMemoryNode => 
      node.type === 'youtube_video'
    );

    // Sort by views for top performing
    const topPerforming = [...videoNodes].sort((a, b) => 
      (b.content.metrics.views || 0) - (a.content.metrics.views || 0)
    ).slice(0, 5);

    // Calculate trends
    const views = videoNodes.map(node => node.content.metrics.views || 0);
    const engagement = videoNodes.map(node => 
      (node.content.engagement.likes + node.content.engagement.comments) / 
      (node.content.metrics.views || 1)
    );

    // Aggregate topics
    const topicCounts = new Map<string, number>();
    videoNodes.forEach(node => {
      node.content.topics.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });

    const topics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    return {
      topPerforming,
      trends: {
        views,
        engagement,
        topics
      }
    };
  }

  private async createEnhancedVideoNode(
    videoId: string, 
    metrics: YouTubeMetrics, 
    context: string
  ): Promise<YouTubeMemoryNode> {
    const analysis = await this.analyzeVideo(metrics);
    
    return {
      id: nanoid(),
      type: 'youtube_video',
      content: {
        videoId,
        title: metrics.topVideos[0]?.title || '',
        description: '', // Would need to be passed from the YouTube API
        publishedAt: metrics.topVideos[0]?.publishedAt || new Date().toISOString(),
        metrics,
        topics: analysis.mainTopics,
        key_points: [], // Would need content analysis
        sentiment: 'neutral', // Would need content analysis
        lastReferencedAt: Date.now(),
        useCount: 1,
        engagement: {
          likes: metrics.engagement.likes,
          comments: metrics.engagement.comments,
          shares: metrics.engagement.shares,
          averageViewPercentage: metrics.engagement.averageViewPercentage
        },
        analysis
      },
      confidence: 1,
      relationships: new Map(),
      timestamp: Date.now(),
      context: {
        situation: `custom_${context.replace(/\s+/g, '_')}`,
        emotional_state: {
          primary: 'neutral',
          intensity: 0.5,
          confidence: 1.0
        },
        external_factors: [],
        success_metrics: {
          views: metrics.views,
          engagement: metrics.engagement.rate
        }
      },
      evolution: {
        history: [{
          state: {
            content: {
              views: metrics.views,
              engagement: metrics.engagement.rate,
              subscribers: metrics.subscribers
            },
            timestamp: Date.now()
          },
          timestamp: Date.now(),
          trigger: 'initial_creation'
        }],
        trend: 'stable',
        stability: 1.0
      }
    };
  }

  private async analyzeVideo(metrics: YouTubeMetrics) {
    // This would ideally use more sophisticated analysis
    return {
      mainTopics: [], // Would need content analysis
      contentType: ['video'],
      performanceInsights: [
        `Video received ${metrics.views} views`,
        `Engagement rate: ${((metrics.engagement.total / metrics.views) * 100).toFixed(2)}%`,
        `Average view percentage: ${(metrics.engagement.averageViewPercentage * 100).toFixed(2)}%`
      ],
      audienceRetention: metrics.engagement.averageViewPercentage,
      engagementPatterns: [
        `Likes to views ratio: ${((metrics.engagement.likes / metrics.views) * 100).toFixed(2)}%`,
        `Comments to views ratio: ${((metrics.engagement.comments / metrics.views) * 100).toFixed(2)}%`
      ]
    };
  }

  private async updateVideoContext(videoId: string, metrics: YouTubeMetrics) {
    const analysis = await this.analyzeVideo(metrics);
    
    this.videoContextCache.set(videoId, {
      videoId,
      analysis,
      lastAccessed: Date.now(),
      accessCount: 1
    });
  }

  private async createVideoRelationships(videoNode: YouTubeMemoryNode) {
    // Find related videos based on topics and metrics
    const relatedNodes = await this.memorySystem.searchNodes({
      type: 'youtube_video',
      query: videoNode.content.topics.join(' ')
    });

    // Create relationships with related videos
    for (const relatedNode of relatedNodes) {
      if (relatedNode.id === videoNode.id) continue;

      const strength = this.calculateRelationshipStrength(videoNode, relatedNode);
      
      videoNode.relationships.set(relatedNode.id, {
        type: 'similar_to',
        strength,
        evidence: [
          `Topic similarity: ${strength.toFixed(2)}`,
          `Published within 30 days of each other`
        ]
      });
    }

    await this.memorySystem.updateNode(videoNode);
  }

  private calculateRelationshipStrength(node1: YouTubeMemoryNode, node2: MemoryNode): number {
    if (node2.type !== 'youtube_video') return 0;

    const topicOverlap = node1.content.topics.filter(topic => 
      (node2 as YouTubeMemoryNode).content.topics.includes(topic)
    ).length;

    const timeProximity = Math.abs(
      new Date(node1.content.publishedAt).getTime() - 
      new Date((node2 as YouTubeMemoryNode).content.publishedAt).getTime()
    );

    const topicScore = topicOverlap / Math.max(node1.content.topics.length, 1);
    const timeScore = Math.exp(-timeProximity / (30 * 24 * 60 * 60 * 1000)); // 30 days time constant

    return (topicScore * 0.7 + timeScore * 0.3);
  }

  private needsRefresh(nodes: YouTubeMemoryNode[]): boolean {
    if (nodes.length === 0) return true;
    
    const mostRecent = Math.max(...nodes.map(n => n.content.lastReferencedAt));
    const hoursSinceUpdate = (Date.now() - mostRecent) / (60 * 60 * 1000);
    
    return hoursSinceUpdate > 24; // Refresh if data is older than 24 hours
  }

  private calculateConfidence(nodes: YouTubeMemoryNode[], query: string): number {
    if (nodes.length === 0) return 0;

    // Calculate relevance based on topic matching
    const queryTerms = query.toLowerCase().split(' ');
    const topicMatches = nodes.map(node => 
      node.content.topics.filter(topic => 
        queryTerms.some(term => topic.toLowerCase().includes(term))
      ).length
    );

    const maxTopicMatches = Math.max(...topicMatches);
    const avgTopicMatches = topicMatches.reduce((a, b) => a + b, 0) / topicMatches.length;

    // Consider recency
    const mostRecent = Math.max(...nodes.map(n => n.content.lastReferencedAt));
    const hoursSinceUpdate = (Date.now() - mostRecent) / (60 * 60 * 1000);
    const recencyScore = Math.exp(-hoursSinceUpdate / 24); // Decay over 24 hours

    return Math.min(
      (maxTopicMatches * 0.4 + avgTopicMatches * 0.3 + recencyScore * 0.3),
      1
    );
  }
} 