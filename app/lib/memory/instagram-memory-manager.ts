import { 
  InstagramMemoryManager, 
  InstagramMemoryNode, 
  InstagramMemorySearchResult,
  MemoryNode
} from './types';
import { InstagramMetrics } from '../types/social';
import { AdvancedMemorySystem } from './advanced-memory-system';
import { nanoid } from 'nanoid';

interface PostContext {
  postId: string;
  analysis: {
    mainTopics: string[];
    contentType: string[];
    performanceInsights: string[];
    audienceRetention?: number;
    engagementPatterns?: string[];
    hashtagPerformance?: Array<{
      hashtag: string;
      engagement: number;
      reach: number;
    }>;
  };
  lastAccessed: number;
  accessCount: number;
}

export class InstagramMemoryManagerImpl implements InstagramMemoryManager {
  private memorySystem: AdvancedMemorySystem;
  private postContextCache: Map<string, PostContext>;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(memorySystem: AdvancedMemorySystem) {
    this.memorySystem = memorySystem;
    this.postContextCache = new Map();
  }

  async storePost(postId: string, metrics: InstagramMetrics, context: string): Promise<void> {
    // Create and store the post node
    const postNode = await this.createEnhancedPostNode(postId, metrics, context);
    await this.memorySystem.addNode(postNode);
    
    // Update post context
    await this.updatePostContext(postId, metrics);
    
    // Create relationships with other content
    await this.createPostRelationships(postNode);
  }

  async findRelevantPosts(query: string, context: string): Promise<InstagramMemorySearchResult> {
    const nodes = await this.memorySystem.searchNodes({
      type: 'instagram_post',
      query: query,
      context: context
    });

    const postNodes = nodes.filter((node): node is InstagramMemoryNode => 
      node.type === 'instagram_post' || 
      node.type === 'instagram_story' || 
      node.type === 'instagram_reel'
    );

    const needsRefresh = this.needsRefresh(postNodes);
    const confidence = this.calculateConfidence(postNodes, query);

    return {
      nodes: postNodes,
      confidence,
      needsRefresh
    };
  }

  async getPostInsights(postId: string): Promise<string[]> {
    const nodes = await this.memorySystem.searchNodes({
      type: 'instagram_post',
      query: postId
    });

    const postNode = nodes.find((node): node is InstagramMemoryNode => 
      (node.type === 'instagram_post' || 
       node.type === 'instagram_story' || 
       node.type === 'instagram_reel') && 
      typeof node.content === 'object' &&
      node.content !== null &&
      'postId' in node.content &&
      node.content.postId === postId
    );

    if (!postNode) return [];

    return [
      ...postNode.content.key_points,
      ...postNode.content.analysis.performanceInsights,
      ...(postNode.content.analysis.hashtagPerformance?.map(h => 
        `Hashtag #${h.hashtag} performance: ${h.engagement} engagement, ${h.reach} reach`
      ) || [])
    ];
  }

  async updatePostReference(postId: string): Promise<void> {
    const nodes = await this.memorySystem.searchNodes({
      type: 'instagram_post',
      query: postId
    });

    const postNode = nodes.find((node): node is InstagramMemoryNode => 
      (node.type === 'instagram_post' || 
       node.type === 'instagram_story' || 
       node.type === 'instagram_reel') && 
      typeof node.content === 'object' &&
      node.content !== null &&
      'postId' in node.content &&
      node.content.postId === postId
    );

    if (postNode) {
      postNode.content.lastReferencedAt = Date.now();
      postNode.content.useCount++;
      await this.memorySystem.updateNode(postNode);

      // Update post context if available
      const postContext = this.postContextCache.get(postId);
      if (postContext) {
        postContext.lastAccessed = Date.now();
        postContext.accessCount++;
        this.postContextCache.set(postId, postContext);
      }
    }
  }

  async analyzeContentTrends(timeframe: string): Promise<{
    topPerforming: InstagramMemoryNode[];
    trends: {
      engagement: number[];
      reach: number[];
      topics: { topic: string; count: number }[];
      hashtags: { hashtag: string; performance: number }[];
    };
  }> {
    const nodes = await this.memorySystem.searchNodes({
      type: 'instagram_post',
      query: ''
    });

    const postNodes = nodes.filter((node): node is InstagramMemoryNode => 
      node.type === 'instagram_post' || 
      node.type === 'instagram_story' || 
      node.type === 'instagram_reel'
    );

    // Sort by engagement for top performing
    const topPerforming = [...postNodes].sort((a, b) => 
      (b.content.engagement.likes + b.content.engagement.comments) - 
      (a.content.engagement.likes + a.content.engagement.comments)
    ).slice(0, 5);

    // Calculate trends
    const engagement = postNodes.map(node => 
      node.content.engagement.likes + 
      node.content.engagement.comments + 
      (node.content.engagement.saves || 0)
    );

    const reach = postNodes.map(node => 
      (node.content.metrics.reach || 0)
    );

    // Aggregate topics
    const topicCounts = new Map<string, number>();
    postNodes.forEach(node => {
      node.content.topics.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });

    const topics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    // Analyze hashtag performance
    const hashtagPerformance = new Map<string, { engagement: number; count: number }>();
    postNodes.forEach(node => {
      node.content.analysis.hashtagPerformance?.forEach(h => {
        const current = hashtagPerformance.get(h.hashtag) || { engagement: 0, count: 0 };
        hashtagPerformance.set(h.hashtag, {
          engagement: current.engagement + h.engagement,
          count: current.count + 1
        });
      });
    });

    const hashtags = Array.from(hashtagPerformance.entries())
      .map(([hashtag, stats]) => ({
        hashtag,
        performance: stats.engagement / stats.count
      }))
      .sort((a, b) => b.performance - a.performance);

    return {
      topPerforming,
      trends: {
        engagement,
        reach,
        topics,
        hashtags
      }
    };
  }

  private async createEnhancedPostNode(
    postId: string, 
    metrics: InstagramMetrics, 
    context: string
  ): Promise<InstagramMemoryNode> {
    const analysis = await this.analyzePost(metrics);
    
    return {
      id: nanoid(),
      type: 'instagram_post',
      content: {
        postId,
        mediaType: 'image', // This should be determined from the actual post data
        url: '', // This should come from the Instagram API
        publishedAt: new Date().toISOString(), // This should come from the Instagram API
        metrics,
        topics: analysis.mainTopics,
        key_points: [], // Would need content analysis
        sentiment: 'neutral', // Would need content analysis
        lastReferencedAt: Date.now(),
        useCount: 1,
        engagement: {
          likes: metrics.engagement?.details?.likes || 0,
          comments: metrics.engagement?.details?.comments || 0,
          saves: metrics.engagement?.details?.saves || 0,
          shares: metrics.engagement?.details?.shares || 0
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
          confidence: 0.8
        },
        external_factors: [],
        success_metrics: {
          engagement: metrics.engagement?.rate || 0,
          reach: metrics.reach || 0
        }
      },
      evolution: {
        history: [{
          state: {
            content: {
              engagement: metrics.engagement?.rate || 0,
              reach: metrics.reach || 0,
              followers: metrics.followers || 0
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

  private async analyzePost(metrics: InstagramMetrics) {
    // This would ideally use more sophisticated analysis
    return {
      mainTopics: [], // Would need content analysis
      contentType: ['post'],
      performanceInsights: [
        `Post reached ${metrics.reach} accounts`,
        `Engagement rate: ${metrics.engagement?.rate.toFixed(2)}%`,
        `Save rate: ${metrics.saveRate?.toFixed(2)}%`
      ],
      audienceRetention: undefined, // Would need video metrics
      engagementPatterns: [
        `Like rate: ${((metrics.engagement?.details?.likes || 0) / (metrics.reach || 1) * 100).toFixed(2)}%`,
        `Comment rate: ${((metrics.engagement?.details?.comments || 0) / (metrics.reach || 1) * 100).toFixed(2)}%`,
        `Save rate: ${((metrics.engagement?.details?.saves || 0) / (metrics.reach || 1) * 100).toFixed(2)}%`
      ],
      hashtagPerformance: [] // Would need hashtag-specific metrics
    };
  }

  private async updatePostContext(postId: string, metrics: InstagramMetrics) {
    const analysis = await this.analyzePost(metrics);
    
    this.postContextCache.set(postId, {
      postId,
      analysis,
      lastAccessed: Date.now(),
      accessCount: 1
    });
  }

  private async createPostRelationships(postNode: InstagramMemoryNode) {
    // Find related posts based on topics and metrics
    const relatedNodes = await this.memorySystem.searchNodes({
      type: 'instagram_post',
      query: postNode.content.topics.join(' ')
    });

    // Create relationships with related posts
    for (const relatedNode of relatedNodes) {
      if (relatedNode.id === postNode.id) continue;

      const strength = this.calculateRelationshipStrength(postNode, relatedNode);
      
      postNode.relationships.set(relatedNode.id, {
        type: 'similar_to',
        strength,
        evidence: [
          `Topic similarity: ${strength.toFixed(2)}`,
          `Published within 30 days of each other`
        ]
      });
    }

    await this.memorySystem.updateNode(postNode);
  }

  private calculateRelationshipStrength(node1: InstagramMemoryNode, node2: MemoryNode): number {
    if (!this.isInstagramNode(node2)) return 0;

    const topicOverlap = node1.content.topics.filter(topic => 
      node2.content.topics.includes(topic)
    ).length;

    const timeProximity = Math.abs(
      new Date(node1.content.publishedAt).getTime() - 
      new Date(node2.content.publishedAt).getTime()
    );

    const topicScore = topicOverlap / Math.max(node1.content.topics.length, 1);
    const timeScore = Math.exp(-timeProximity / (30 * 24 * 60 * 60 * 1000)); // 30 days time constant

    return (topicScore * 0.7 + timeScore * 0.3);
  }

  private isInstagramNode(node: MemoryNode): node is InstagramMemoryNode {
    return node.type === 'instagram_post' || 
           node.type === 'instagram_story' || 
           node.type === 'instagram_reel';
  }

  private needsRefresh(nodes: InstagramMemoryNode[]): boolean {
    if (nodes.length === 0) return true;
    
    const mostRecent = Math.max(...nodes.map(n => n.content.lastReferencedAt));
    const hoursSinceUpdate = (Date.now() - mostRecent) / (60 * 60 * 1000);
    
    return hoursSinceUpdate > 24; // Refresh if data is older than 24 hours
  }

  private calculateConfidence(nodes: InstagramMemoryNode[], query: string): number {
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