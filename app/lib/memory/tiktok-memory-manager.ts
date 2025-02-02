import { 
  TikTokMemoryManager, 
  TikTokMemoryNode, 
  TikTokMemorySearchResult,
  MemoryNode
} from './types';
import { TikTokMetrics } from '../../lib/types/social';
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
    soundPerformance?: {
      views: number;
      engagement: number;
      completionRate: number;
    };
    challengePerformance?: Array<{
      challengeName: string;
      views: number;
      engagement: number;
      trend: 'rising' | 'stable' | 'declining';
    }>;
  };
  lastAccessed: number;
  accessCount: number;
}

export class TikTokMemoryManagerImpl implements TikTokMemoryManager {
  private memorySystem: AdvancedMemorySystem;
  private videoContextCache: Map<string, VideoContext>;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(memorySystem: AdvancedMemorySystem) {
    this.memorySystem = memorySystem;
    this.videoContextCache = new Map();
  }

  async storeVideo(videoId: string, metrics: TikTokMetrics, context: string): Promise<void> {
    // Create and store the video node
    const videoNode = await this.createEnhancedVideoNode(videoId, metrics, context);
    await this.memorySystem.addNode(videoNode);
    
    // Update video context
    await this.updateVideoContext(videoId, metrics);
    
    // Create relationships with other content
    await this.createVideoRelationships(videoNode);
  }

  async findRelevantVideos(query: string, context: string): Promise<TikTokMemorySearchResult> {
    const nodes = await this.memorySystem.searchNodes({
      type: 'tiktok_video',
      query: query,
      context: context
    });

    const videoNodes = nodes.filter((node): node is TikTokMemoryNode => 
      node.type === 'tiktok_video'
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
      type: 'tiktok_video',
      query: videoId
    });

    const videoNode = nodes.find((node): node is TikTokMemoryNode => 
      node.type === 'tiktok_video' && 
      typeof node.content === 'object' &&
      node.content !== null &&
      'videoId' in node.content &&
      node.content.videoId === videoId
    );

    if (!videoNode) return [];

    return [
      ...videoNode.content.key_points,
      ...videoNode.content.analysis.performanceInsights,
      ...(videoNode.content.analysis.soundPerformance ? 
        [`Sound performance: ${videoNode.content.analysis.soundPerformance.engagement}% engagement`] : []),
      ...(videoNode.content.analysis.challengePerformance?.map(c => 
        `Challenge #${c.challengeName} performance: ${c.views} views, ${c.engagement}% engagement, ${c.trend} trend`
      ) || [])
    ];
  }

  async updateVideoReference(videoId: string): Promise<void> {
    const nodes = await this.memorySystem.searchNodes({
      type: 'tiktok_video',
      query: videoId
    });

    const videoNode = nodes.find((node): node is TikTokMemoryNode => 
      node.type === 'tiktok_video' && 
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

  async analyzeContentTrends(timeframe: string): Promise<{
    topPerforming: TikTokMemoryNode[];
    trends: {
      views: number[];
      engagement: number[];
      topics: { topic: string; count: number }[];
      sounds: { soundId: string; performance: number }[];
      challenges: { challengeName: string; performance: number }[];
      completionRates: number[];
    };
  }> {
    const nodes = await this.memorySystem.searchNodes({
      type: 'tiktok_video',
      query: ''
    });

    const videoNodes = nodes.filter((node): node is TikTokMemoryNode => 
      node.type === 'tiktok_video'
    );

    // Sort by views for top performing
    const topPerforming = [...videoNodes].sort((a, b) => 
      (b.content.engagement.views || 0) - (a.content.engagement.views || 0)
    ).slice(0, 5);

    // Calculate trends
    const views = videoNodes.map(node => node.content.engagement.views || 0);
    const engagement = videoNodes.map(node => 
      ((node.content.engagement.likes + node.content.engagement.comments + 
        node.content.engagement.shares) / (node.content.engagement.views || 1)) * 100
    );
    const completionRates = videoNodes.map(node => 
      node.content.engagement.completionRate || 0
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

    // Analyze sound performance
    const soundPerformance = new Map<string, { views: number; engagement: number; count: number }>();
    videoNodes.forEach(node => {
      if (node.content.soundId) {
        const current = soundPerformance.get(node.content.soundId) || 
          { views: 0, engagement: 0, count: 0 };
        soundPerformance.set(node.content.soundId, {
          views: current.views + (node.content.engagement.views || 0),
          engagement: current.engagement + 
            ((node.content.engagement.likes + node.content.engagement.comments) / 
             (node.content.engagement.views || 1)),
          count: current.count + 1
        });
      }
    });

    const sounds = Array.from(soundPerformance.entries())
      .map(([soundId, stats]) => ({
        soundId,
        performance: (stats.engagement / stats.count) * 100
      }))
      .sort((a, b) => b.performance - a.performance);

    // Analyze challenge performance
    const challengePerformance = new Map<string, { views: number; engagement: number; count: number }>();
    videoNodes.forEach(node => {
      node.content.challengeNames?.forEach((challenge, index) => {
        const current = challengePerformance.get(challenge) || 
          { views: 0, engagement: 0, count: 0 };
        challengePerformance.set(challenge, {
          views: current.views + (node.content.engagement.views || 0),
          engagement: current.engagement + 
            ((node.content.engagement.likes + node.content.engagement.comments) / 
             (node.content.engagement.views || 1)),
          count: current.count + 1
        });
      });
    });

    const challenges = Array.from(challengePerformance.entries())
      .map(([challengeName, stats]) => ({
        challengeName,
        performance: (stats.engagement / stats.count) * 100
      }))
      .sort((a, b) => b.performance - a.performance);

    return {
      topPerforming,
      trends: {
        views,
        engagement,
        topics,
        sounds,
        challenges,
        completionRates
      }
    };
  }

  private async createEnhancedVideoNode(
    videoId: string, 
    metrics: TikTokMetrics, 
    context: string
  ): Promise<TikTokMemoryNode> {
    const analysis = await this.analyzeVideo(metrics);
    
    return {
      id: nanoid(),
      type: 'tiktok_video',
      content: {
        videoId,
        caption: metrics.caption || '',
        soundId: metrics.soundId,
        soundName: metrics.soundName,
        challengeIds: metrics.challengeIds,
        challengeNames: metrics.challengeNames,
        url: metrics.url || '',
        publishedAt: metrics.publishedAt || new Date().toISOString(),
        metrics,
        topics: analysis.mainTopics,
        key_points: [], // Would need content analysis
        sentiment: 'neutral', // Would need content analysis
        lastReferencedAt: Date.now(),
        useCount: 1,
        engagement: {
          likes: metrics.engagement?.details?.likes || 0,
          comments: metrics.engagement?.details?.comments || 0,
          shares: metrics.engagement?.details?.shares || 0,
          views: metrics.views || 0,
          completionRate: metrics.completionRate || 0,
          watchTime: metrics.watchTime || 0
        },
        analysis
      },
      confidence: 1,
      relationships: new Map(),
      timestamp: Date.now(),
      context: {
        situation: `custom_${context}`,
        emotional_state: {
          primary: 'neutral',
          intensity: 0.5,
          confidence: 1.0
        },
        external_factors: [],
        success_metrics: {
          views: metrics.views,
          engagement: metrics.engagement?.rate || 0,
          completion: metrics.completionRate
        }
      },
      evolution: {
        history: [{
          state: {
            content: {
              views: metrics.views,
              engagement: metrics.engagement?.rate || 0,
              completion: metrics.completionRate
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

  private async analyzeVideo(metrics: TikTokMetrics) {
    // This would ideally use more sophisticated analysis
    return {
      mainTopics: [], // Would need content analysis
      contentType: ['video'],
      performanceInsights: [
        `Video received ${metrics.views} views`,
        `Engagement rate: ${metrics.engagement?.rate.toFixed(2)}%`,
        `Completion rate: ${metrics.completionRate?.toFixed(2)}%`,
        `Average watch time: ${metrics.watchTime} seconds`
      ],
      audienceRetention: metrics.completionRate,
      engagementPatterns: [
        `Like rate: ${((metrics.engagement?.details?.likes || 0) / (metrics.views || 1) * 100).toFixed(2)}%`,
        `Comment rate: ${((metrics.engagement?.details?.comments || 0) / (metrics.views || 1) * 100).toFixed(2)}%`,
        `Share rate: ${((metrics.engagement?.details?.shares || 0) / (metrics.views || 1) * 100).toFixed(2)}%`
      ],
      soundPerformance: metrics.soundId ? {
        views: metrics.views || 0,
        engagement: metrics.engagement?.rate || 0,
        completionRate: metrics.completionRate || 0
      } : undefined,
      challengePerformance: metrics.challengeNames?.map((challenge, index) => ({
        challengeName: challenge,
        views: metrics.views || 0,
        engagement: metrics.engagement?.rate || 0,
        trend: 'stable' as const // Explicitly type as literal
      }))
    };
  }

  private async updateVideoContext(videoId: string, metrics: TikTokMetrics) {
    const analysis = await this.analyzeVideo(metrics);
    
    this.videoContextCache.set(videoId, {
      videoId,
      analysis,
      lastAccessed: Date.now(),
      accessCount: 1
    });
  }

  private async createVideoRelationships(videoNode: TikTokMemoryNode) {
    // Find related videos based on topics, sounds, and challenges
    const relatedNodes = await this.memorySystem.searchNodes({
      type: 'tiktok_video',
      query: [
        ...videoNode.content.topics,
        videoNode.content.soundName || '',
        ...(videoNode.content.challengeNames || [])
      ].join(' ')
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
          ...(this.hasSameSound(videoNode, relatedNode) ? ['Same sound used'] : []),
          ...(this.hasCommonChallenges(videoNode, relatedNode) ? ['Common challenges'] : [])
        ]
      });
    }

    await this.memorySystem.updateNode(videoNode);
  }

  private hasSameSound(node1: TikTokMemoryNode, node2: MemoryNode): boolean {
    if (!this.isTikTokNode(node2)) return false;
    return node1.content.soundId === node2.content.soundId;
  }

  private hasCommonChallenges(node1: TikTokMemoryNode, node2: MemoryNode): boolean {
    if (!this.isTikTokNode(node2)) return false;
    return node1.content.challengeNames?.some(challenge => 
      node2.content.challengeNames?.includes(challenge)
    ) || false;
  }

  private calculateRelationshipStrength(node1: TikTokMemoryNode, node2: MemoryNode): number {
    if (!this.isTikTokNode(node2)) return 0;

    const topicOverlap = node1.content.topics.filter(topic => 
      node2.content.topics.includes(topic)
    ).length;

    const timeProximity = Math.abs(
      new Date(node1.content.publishedAt).getTime() - 
      new Date(node2.content.publishedAt).getTime()
    );

    const soundBonus = this.hasSameSound(node1, node2) ? 0.2 : 0;
    const challengeBonus = this.hasCommonChallenges(node1, node2) ? 0.2 : 0;

    const topicScore = topicOverlap / Math.max(node1.content.topics.length, 1);
    const timeScore = Math.exp(-timeProximity / (30 * 24 * 60 * 60 * 1000)); // 30 days time constant

    return Math.min(
      (topicScore * 0.4 + timeScore * 0.2 + soundBonus + challengeBonus),
      1
    );
  }

  private isTikTokNode(node: MemoryNode): node is TikTokMemoryNode {
    return node.type === 'tiktok_video';
  }

  private needsRefresh(nodes: TikTokMemoryNode[]): boolean {
    if (nodes.length === 0) return true;
    
    const mostRecent = Math.max(...nodes.map(n => n.content.lastReferencedAt));
    const hoursSinceUpdate = (Date.now() - mostRecent) / (60 * 60 * 1000);
    
    return hoursSinceUpdate > 24; // Refresh if data is older than 24 hours
  }

  private calculateConfidence(nodes: TikTokMemoryNode[], query: string): number {
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