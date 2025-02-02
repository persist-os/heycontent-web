import { BaseAgent, AgentContext, Demographics, AudienceBehavior, Partnership } from "./base-agent";
import { RAGSystem } from "../rag";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { SuggestedPartnership } from "@/src/types/partnerships";
import { GmailService } from "../services/gmail";
import { PartnershipEmail } from '@/app/types/social-platforms';

interface PerformancePrediction {
  metrics: {
    engagement: {
      predicted: number;
      confidence: number;
      range: { min: number; max: number };
    };
    reach: {
      predicted: number;
      confidence: number;
      range: { min: number; max: number };
    };
    revenue: {
      predicted: number;
      confidence: number;
      range: { min: number; max: number };
    };
  };
  timeline: {
    shortTerm: string;
    mediumTerm: string;
    longTerm: string;
  };
  factors: {
    positive: string[];
    negative: string[];
    risks: string[];
  };
  confidence: number;
}

interface PartnershipScore {
  alignmentScore: number;
  audienceMatch: number;
  contentFit: number;
  engagementPotential: 'high' | 'medium' | 'low';
  confidence: number;
  factors: {
    demographics: number;
    interests: number;
    niche: number;
    platform: number;
    [key: string]: number;
  };
}

interface CollaborationStrategy {
  type: 'content' | 'product' | 'event' | 'cross-promotion';
  platform: string;
  format: string;
  timeline: string;
  requirements: string[];
  predictedEngagement: number;
  bestTimeToPost?: string;
  expectedOutcome: string;
}

interface PartnershipPerformance {
  engagement?: number;
  reach?: number;
  revenue?: number;
  [key: string]: number | undefined;
}

interface PartnershipInfo {
  platform: string;
  partnerId: string;
  status: string;
  performance?: PartnershipPerformance;
}

interface PartnershipRecommendations {
  potentialPartners: SuggestedPartnership[];
  collaborationStrategies: Record<string, CollaborationStrategy>;
  partnershipScores: Record<string, PartnershipScore>;
  performancePredictions: Record<string, PerformancePrediction>;
  timestamp: string;
}

interface PartnershipAgentResponse {
  output: string | null;
  error?: Error;
  analysis?: string;
  metrics?: PartnershipContext['metrics'];
  partnershipRecommendations?: PartnershipRecommendations;
  timestamp?: string;
}

interface PartnershipContext extends AgentContext {
  metrics: {
    youtube?: {
      views: number;
      subscribers: number;
      engagement: number;
      demographics: Demographics;
    };
    instagram?: {
      followers: number;
      engagement: number;
      demographics: Demographics;
    };
    tiktok?: {
      followers: number;
      engagement: number;
      demographics: Demographics;
    };
  };
  niche: string;
  targetAudience: {
    demographics: Demographics;
    interests: string[];
    behavior: AudienceBehavior;
  };
  currentPartnerships?: PartnershipInfo[];
}

export class PartnershipsAgent extends BaseAgent {
  constructor(userId: string, rag: RAGSystem) {
    super(userId, rag, 'partnerships');
  }

  protected systemPrompt = `You are an expert partnerships strategist focused on identifying and analyzing collaboration opportunities across multiple platforms.

Core Rules:
1. Focus on strategic partnerships:
   - Identify relevant partners
   - Analyze partnership potential
   - Track partnership performance
   - Optimize collaboration strategies

2. Enable cross-platform synergy:
   - Find multi-platform opportunities
   - Analyze audience alignment
   - Optimize collaboration formats
   - Track cross-platform impact

3. Provide partnership intelligence:
   - Monitor partnership trends
   - Track successful collaborations
   - Identify growth opportunities
   - Assess partnership ROI`;

  async process(input: string, context?: PartnershipContext): Promise<PartnershipAgentResponse> {
    try {
      // Ensure we have a context object with required properties
      context = context || {
        userId: this.userId,
        metrics: {},
        niche: '',
        targetAudience: {
          demographics: {
            ageGroups: [],
            genders: [],
            locations: [],
            languages: []
          },
          interests: [],
          behavior: {
            contentPreferences: [],
            behavioralTraits: [],
            peakTimes: [],
            interactionPatterns: []
          }
        }
      };

      // Get cross-agent context
      const crossAgentContext = await this.getCrossAgentContext(input, context);

      // Get platform integration status
      const integrationStatus = await this.getIntegrationStatus(context.userId);

      // Get user's persona
      const userPersona = await this.rag.getUserPersona(context.userId);

      // Generate partnership recommendations
      const partnershipRecommendations = await this.generatePartnershipRecommendations(context);

      // Create messages for the model
      const messages = [
        new SystemMessage(this.systemPrompt),
        new HumanMessage({
          content: input,
          additional_kwargs: {
            userPersona,
            crossAgentContext,
            integrationStatus,
            partnershipRecommendations,
            metrics: context.metrics
          }
        })
      ];

      // Generate partnerships analysis
      const response = await this.model.invoke(messages);

      if (!(response instanceof AIMessage)) {
        throw new Error("Unexpected response type from model");
      }

      // Convert response content to string
      const responseContent = this.convertMessageContentToString(response.content);

      // Store the analysis with all context
      const result = {
        analysis: responseContent,
        metrics: context.metrics,
        partnershipRecommendations,
        timestamp: new Date().toISOString()
      };

      await this.storeResult(
        JSON.stringify(result),
        {
          type: "insight",
          category: "partnership",
          user_id: context.userId,
          timestamp: new Date().toISOString()
        }
      );

      // Update partnerships screen data for real-time updates
      await this.updateScreenData(context.userId, {
        ...result,
        lastUpdate: new Date().toISOString()
      });

      return {
        output: responseContent,
        analysis: responseContent,
        metrics: context.metrics,
        partnershipRecommendations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("PartnershipsAgent error:", error);
      return {
        output: null,
        error: error instanceof Error ? error : new Error("Unknown error")
      };
    }
  }

  private async generatePartnershipRecommendations(context: PartnershipContext) {
    if (!context.niche || !context.targetAudience) {
      throw new Error("Niche and target audience are required for partnership recommendations");
    }

    const { metrics, niche, targetAudience } = context;
    const currentPartnerships = context.currentPartnerships || [];
    
    // Find potential partners
    const potentialPartners = await this.findPotentialPartners(context);

    // Generate collaboration strategies
    const collaborationStrategies = this.generateCollaborationStrategies(potentialPartners, context);

    // Calculate partnership scores
    const partnershipScores = this.calculatePartnershipScores(potentialPartners, context);

    // Generate performance predictions
    const performancePredictions = this.predictPartnershipPerformance(potentialPartners, context);

    return {
      potentialPartners,
      collaborationStrategies,
      partnershipScores,
      performancePredictions,
      timestamp: new Date().toISOString()
    };
  }

  private async findPotentialPartners(context: PartnershipContext): Promise<SuggestedPartnership[]> {
    if (!context.niche || !context.targetAudience) {
      throw new Error("Niche and target audience are required to find potential partners");
    }

    const potentialPartners: SuggestedPartnership[] = [];

    try {
      // Get integration status to check available data sources
      const integrationStatus = await this.getIntegrationStatus(context.userId);

      // 1. Get partnership opportunities from emails if Gmail is connected
      if (integrationStatus.gmail?.emails) {
        const emailPartners = await this.findEmailPartners(context);
        potentialPartners.push(...emailPartners);
      }

      // 2. Get partnership opportunities from social signals
      if (integrationStatus.instagram?.insights || 
          integrationStatus.youtube?.analytics || 
          integrationStatus.tiktok?.analytics) {
        const socialPartners = await this.findSocialPartners(context);
        potentialPartners.push(...socialPartners);
      }

      // 3. Get historical partnership data from RAG
      const historicalPartners = await this.findHistoricalPartners(context);
      potentialPartners.push(...historicalPartners);

      // 4. Deduplicate partners based on brand name
      const uniquePartners = this.deduplicatePartners(potentialPartners);

      // 5. Sort by confidence score
      return uniquePartners.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error("Error finding potential partners:", error);
      return [];
    }
  }

  private async findEmailPartners(context: PartnershipContext): Promise<SuggestedPartnership[]> {
    // Get partnership emails from the last 90 days
    const gmailService = new GmailService(context.userId);
    const partnershipEmails = await gmailService.getPartnershipEmails({
      maxResults: 50,
      includeThreads: true
    });

    // Convert partnership emails to suggested partnerships
    return partnershipEmails.map(email => {
      const brand = this.extractBrandFromEmail(email.from);
      const signals = {
        comments: email.thread?.messageCount || 0,
        likes: email.analysis?.priority === 'high' ? 10 : email.analysis?.priority === 'medium' ? 5 : 0,
        dms: email.thread?.participants.length || 0
      };

      return {
        id: email.id,
        brand,
        signals,
        confidence: this.calculateEmailConfidence(email),
        potentialValue: this.estimateDealValue(email),
        status: 'new'
      };
    });
  }

  private async findSocialPartners(context: PartnershipContext): Promise<SuggestedPartnership[]> {
    const partners: SuggestedPartnership[] = [];
    const { metrics } = context;

    // Process each platform's engagement data
    for (const [platform, data] of Object.entries(metrics)) {
      if (!data) continue;

      // Get top engaging accounts that match our niche
      const topAccounts = await this.rag.search('social_engagement', 
        `top engaging accounts in ${context.niche} on ${platform}`
      );

      for (const account of topAccounts) {
        const signals = {
          comments: Math.round(data.engagement * 0.3), // Estimate comment ratio
          likes: Math.round(data.engagement * 0.6),    // Estimate like ratio
          dms: Math.round(data.engagement * 0.1)       // Estimate DM ratio
        };

        partners.push({
          id: `${platform}_${account.pageContent}`,
          brand: account.pageContent,
          signals,
          confidence: this.calculateSocialConfidence(account, context),
          potentialValue: this.estimateSocialValue(data, signals),
          status: 'new'
        });
      }
    }

    return partners;
  }

  private async findHistoricalPartners(context: PartnershipContext): Promise<SuggestedPartnership[]> {
    // Search for past successful partnerships
    const historicalPartnerships = await this.rag.search('insight',
      `successful partnerships in ${context.niche}`,
      { limit: 10 }
    );

    return historicalPartnerships.map(partnership => {
      const data = JSON.parse(partnership.pageContent);
      return {
        id: `historical_${data.id || partnership.id}`,
        brand: data.brand || data.partnerName,
        signals: {
          comments: data.engagement?.comments || 0,
          likes: data.engagement?.likes || 0,
          dms: data.engagement?.directMessages || 0
        },
        confidence: data.successScore || 75, // High confidence for past successful partnerships
        potentialValue: data.value || "$1000",
        status: 'new'
      };
    });
  }

  private deduplicatePartners(partners: SuggestedPartnership[]): SuggestedPartnership[] {
    const uniquePartners = new Map<string, SuggestedPartnership>();
    
    for (const partner of partners) {
      const normalizedBrand = partner.brand.toLowerCase();
      
      if (!uniquePartners.has(normalizedBrand) || 
          partner.confidence > uniquePartners.get(normalizedBrand)!.confidence) {
        uniquePartners.set(normalizedBrand, partner);
      }
    }
    
    return Array.from(uniquePartners.values());
  }

  private extractBrandFromEmail(from: string): string {
    // Extract brand name from email address or sender name
    const emailParts = from.split('@');
    if (emailParts.length < 2) return from;

    const domain = emailParts[1].split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  private calculateEmailConfidence(email: PartnershipEmail): number {
    let confidence = 0;

    // Base confidence from email analysis
    confidence += email.analysis?.priority === 'high' ? 40 :
                 email.analysis?.priority === 'medium' ? 25 : 
                 10;

    // Add points for engagement signals
    confidence += Math.min((email.thread?.messageCount || 0) * 5, 20);
    confidence += Math.min((email.thread?.participants.length || 0) * 5, 20);

    // Add points for specific content indicators
    if (email.analysis?.dealValue) confidence += 10;
    if (email.analysis?.requirements) confidence += 5;
    if (email.analysis?.timeline) confidence += 5;

    return Math.min(confidence, 100);
  }

  private calculateSocialConfidence(account: any, context: PartnershipContext): number {
    let confidence = 75; // Start with base confidence for social signals

    // Adjust based on audience match
    if (account.metadata?.demographics) {
      confidence += this.calculateDemographicMatch(
        account.metadata.demographics,
        context.targetAudience.demographics
      );
    }

    // Adjust based on engagement quality
    if (account.metadata?.engagement) {
      confidence += Math.min(account.metadata.engagement / 100, 15);
    }

    return Math.min(confidence, 100);
  }

  private calculateDemographicMatch(
    partnerDemographics: Demographics,
    targetDemographics: Demographics
  ): number {
    let matchScore = 0;
    
    // Compare age groups
    const partnerAges = partnerDemographics.ageGroups.map(age => 
      typeof age === 'string' ? age : age.name
    );
    const targetAges = targetDemographics.ageGroups.map(age => 
      typeof age === 'string' ? age : age.name
    );
    const ageOverlap = partnerAges.filter(age => targetAges.includes(age)).length;
    matchScore += (ageOverlap / targetAges.length) * 3;

    // Compare locations
    const partnerLocs = partnerDemographics.locations.map(loc => 
      typeof loc === 'string' ? loc : loc.name
    );
    const targetLocs = targetDemographics.locations.map(loc => 
      typeof loc === 'string' ? loc : loc.name
    );
    const locationOverlap = partnerLocs.filter(loc => targetLocs.includes(loc)).length;
    matchScore += (locationOverlap / targetLocs.length) * 3;

    // Compare gender distribution
    const partnerGenders = partnerDemographics.genders.map(gender => 
      typeof gender === 'string' ? gender : gender.name
    );
    const targetGenders = targetDemographics.genders.map(gender => 
      typeof gender === 'string' ? gender : gender.name
    );
    const genderOverlap = partnerGenders.filter(gender => targetGenders.includes(gender)).length;
    matchScore += (genderOverlap / targetGenders.length) * 4;

    return matchScore;
  }

  private estimateDealValue(email: PartnershipEmail): string {
    if (email.analysis?.dealValue) {
      return `$${email.analysis.dealValue}`;
    }

    // Estimate based on engagement signals
    const baseValue = 500; // Base value for any partnership
    const messageMultiplier = (email.thread?.messageCount || 0) * 50;
    const priorityMultiplier = email.analysis?.priority === 'high' ? 2 :
                              email.analysis?.priority === 'medium' ? 1.5 :
                              1;

    const estimatedValue = (baseValue + messageMultiplier) * priorityMultiplier;
    return `$${Math.round(estimatedValue)}`;
  }

  private estimateSocialValue(
    platformMetrics: any,
    signals: { comments: number; likes: number; dms: number }
  ): string {
    const baseValue = 1000; // Base value for social partnerships
    const engagementValue = (signals.comments * 2 + signals.likes + signals.dms * 3) * 0.5;
    const platformMultiplier = platformMetrics.subscribers ? 
                              Math.log10(platformMetrics.subscribers) : 
                              1;

    const estimatedValue = baseValue + engagementValue * platformMultiplier;
    return `$${Math.round(estimatedValue)}`;
  }

  private generateCollaborationStrategies(partners: SuggestedPartnership[], context: PartnershipContext): Record<string, CollaborationStrategy> {
    if (!context.niche || !context.targetAudience) {
      throw new Error("Niche and target audience are required to generate collaboration strategies");
    }
    
    const strategies: Record<string, CollaborationStrategy> = {};
    
    partners.forEach(partner => {
      // Determine the best platform based on metrics and engagement
      const platform = this.determineBestPlatform(context.metrics);
      
      // Analyze engagement signals to determine collaboration type
      const type = this.determineCollaborationType(partner.signals, context.targetAudience);
      
      // Determine format based on platform and audience behavior
      const format = this.determineContentFormat(platform, context.targetAudience.behavior);
      
      // Calculate predicted engagement using historical data and signals
      const predictedEngagement = this.calculatePredictedEngagement(
        partner.signals,
        context.metrics[platform as keyof typeof context.metrics]?.engagement || 0
      );
      
      // Determine optimal posting time based on audience behavior
      const bestTimeToPost = this.determineOptimalPostingTime(
        context.targetAudience.behavior.peakTimes,
        platform
      );
      
      // Generate specific requirements based on type and platform
      const requirements = this.generateRequirements(type, platform, partner.brand);
      
      strategies[partner.id] = {
        type,
        platform,
        format,
        timeline: this.generateTimeline(type, predictedEngagement),
        requirements,
        predictedEngagement,
        bestTimeToPost,
        expectedOutcome: this.generateExpectedOutcome(type, partner.brand, predictedEngagement)
      };
    });

    return strategies;
  }

  private determineBestPlatform(metrics: PartnershipContext['metrics']): string {
    const platforms = Object.entries(metrics).map(([platform, data]) => ({
      platform,
      score: (data.engagement || 0) * (
        platform === 'youtube' && 'subscribers' in data ? data.subscribers :
        (platform === 'instagram' || platform === 'tiktok') && 'followers' in data ? data.followers :
        0
      )
    }));
    
    return platforms.sort((a, b) => b.score - a.score)[0]?.platform || 'youtube';
  }

  private determineCollaborationType(
    signals: SuggestedPartnership['signals'],
    targetAudience: PartnershipContext['targetAudience']
  ): CollaborationStrategy['type'] {
    const totalEngagement = signals.comments + signals.likes + signals.dms;
    
    // High DMs suggest direct product collaboration potential
    if (signals.dms > (signals.comments + signals.likes) / 2) {
      return 'product';
    }
    
    // High comments suggest content collaboration potential
    if (signals.comments > signals.likes / 2) {
      return 'content';
    }
    
    // High overall engagement suggests event potential
    if (totalEngagement > 100) {
      return 'event';
    }
    
    // Default to cross-promotion for balanced metrics
    return 'cross-promotion';
  }

  private determineContentFormat(
    platform: string,
    behavior: AudienceBehavior
  ): string {
    const preferences = behavior.contentPreferences;
    
    // Find the most preferred content type for the platform
    const topPreference = preferences
      .filter(pref => this.isFormatValidForPlatform(pref.type, platform))
      .sort((a, b) => b.percentage - a.percentage)[0];
      
    return topPreference?.type || this.getDefaultFormatForPlatform(platform);
  }

  private isFormatValidForPlatform(format: string, platform: string): boolean {
    const platformFormats: Record<string, string[]> = {
      youtube: ['video', 'live', 'shorts'],
      instagram: ['reel', 'post', 'story', 'live'],
      tiktok: ['video', 'live']
    };
    
    return platformFormats[platform]?.includes(format) || false;
  }

  private getDefaultFormatForPlatform(platform: string): string {
    const defaults: Record<string, string> = {
      youtube: 'video',
      instagram: 'reel',
      tiktok: 'video'
    };
    
    return defaults[platform] || 'video';
  }

  private calculatePredictedEngagement(
    signals: SuggestedPartnership['signals'],
    platformEngagement: number
  ): number {
    const signalWeight = 0.7;
    const platformWeight = 0.3;
    
    const signalEngagement = (signals.comments * 3 + signals.likes + signals.dms * 2) / 6;
    
    return Math.round(
      signalEngagement * signalWeight + platformEngagement * platformWeight
    );
  }

  private determineOptimalPostingTime(
    peakTimes: AudienceBehavior['peakTimes'],
    platform: string
  ): string {
    if (!peakTimes.length) return 'TBD based on audience analysis';
    
    // Find the time slot with highest engagement
    const bestTimeSlot = peakTimes
      .sort((a, b) => b.engagement - a.engagement)[0];
      
    return `${bestTimeSlot.day} at ${bestTimeSlot.times[0]}`;
  }

  private generateRequirements(
    type: CollaborationStrategy['type'],
    platform: string,
    brand: string
  ): string[] {
    const baseRequirements = [
      `${brand} brand guidelines`,
      'Performance tracking setup',
      'Content approval workflow'
    ];
    
    const typeRequirements: Record<CollaborationStrategy['type'], string[]> = {
      content: [
        'Content brief',
        'Creative assets',
        'Key messaging points'
      ],
      product: [
        'Product specifications',
        'Pricing strategy',
        'Distribution plan'
      ],
      event: [
        'Event concept',
        'Timeline',
        'Success metrics'
      ],
      'cross-promotion': [
        'Cross-platform strategy',
        'Content calendar',
        'Promotion schedule'
      ]
    };
    
    return [...baseRequirements, ...typeRequirements[type]];
  }

  private generateTimeline(
    type: CollaborationStrategy['type'],
    predictedEngagement: number
  ): string {
    const timelines: Record<CollaborationStrategy['type'], string> = {
      content: '1-2 months',
      product: '3-4 months',
      event: '2-3 months',
      'cross-promotion': '1-2 months'
    };
    
    return timelines[type];
  }

  private generateExpectedOutcome(
    type: CollaborationStrategy['type'],
    brand: string,
    predictedEngagement: number
  ): string {
    const outcomes: Record<CollaborationStrategy['type'], string> = {
      content: `Co-created content series with ${brand} targeting ${predictedEngagement}+ engagement per post`,
      product: `Product collaboration with ${brand} with projected market reach of ${predictedEngagement * 100}+ potential customers`,
      event: `Joint event with ${brand} expecting ${predictedEngagement * 50}+ participants`,
      'cross-promotion': `Cross-platform promotion campaign with ${brand} aiming for ${predictedEngagement * 2}+ total engagements`
    };
    
    return outcomes[type];
  }

  private calculatePartnershipScores(partners: SuggestedPartnership[], context: PartnershipContext): Record<string, PartnershipScore> {
    if (!context.niche || !context.targetAudience) {
      throw new Error("Niche and target audience are required to calculate partnership scores");
    }

    const scores: Record<string, PartnershipScore> = {};
    
    partners.forEach(partner => {
      // Calculate base alignment score from partner confidence
      const baseAlignmentScore = partner.confidence;
      
      // Calculate audience match based on engagement signals
      const totalSignals = partner.signals.comments + partner.signals.likes + partner.signals.dms;
      const audienceMatch = Math.min((totalSignals / 100) * 100, 100); // Normalize to 0-100
      
      // Calculate content fit based on engagement distribution
      const contentFit = this.calculateContentFit(partner.signals);
      
      // Determine engagement potential based on signals and confidence
      const engagementPotential = this.determineEngagementPotential(partner.signals, partner.confidence);
      
      // Calculate factor scores
      const factorScores = this.calculateFactorScores(
        partner,
        context.targetAudience,
        context.niche,
        context.metrics
      );
      
      scores[partner.id] = {
        alignmentScore: baseAlignmentScore,
        audienceMatch,
        contentFit,
        engagementPotential,
        confidence: partner.confidence,
        factors: factorScores
      };
    });

    return scores;
  }

  private calculateContentFit(signals: SuggestedPartnership['signals']): number {
    // Higher weight for comments as they indicate deeper engagement
    const commentWeight = 0.5;
    const likeWeight = 0.3;
    const dmWeight = 0.2;
    
    // Calculate weighted score
    const totalPossible = 100; // Maximum signals we expect
    const weightedScore = (
      (signals.comments / totalPossible) * commentWeight +
      (signals.likes / totalPossible) * likeWeight +
      (signals.dms / totalPossible) * dmWeight
    ) * 100;
    
    return Math.min(Math.round(weightedScore), 100);
  }

  private determineEngagementPotential(
    signals: SuggestedPartnership['signals'],
    confidence: number
  ): 'high' | 'medium' | 'low' {
    const totalEngagement = signals.comments * 3 + signals.likes + signals.dms * 2;
    const weightedScore = (totalEngagement * (confidence / 100));
    
    if (weightedScore > 150) return 'high';
    if (weightedScore > 75) return 'medium';
    return 'low';
  }

  private calculateFactorScores(
    partner: SuggestedPartnership,
    targetAudience: PartnershipContext['targetAudience'],
    niche: string,
    metrics: PartnershipContext['metrics']
  ): PartnershipScore['factors'] {
    // Calculate demographic match (simplified - would need actual demographic data)
    const demographics = Math.round(partner.confidence * 0.8); // Placeholder until we have demographic data
    
    // Calculate interest match based on niche alignment
    const interests = Math.round(partner.confidence * 0.9); // Placeholder until we have interest data
    
    // Calculate niche alignment based on signals and confidence
    const nicheScore = Math.round(
      (partner.confidence * 0.6) +
      (partner.signals.comments * 0.2) +
      (partner.signals.dms * 0.2)
    );
    
    // Calculate platform score based on available metrics
    const platformScore = Math.round(
      Object.values(metrics).reduce((sum, metric) => sum + (metric?.engagement || 0), 0) / 
      Object.keys(metrics).length
    );
    
    return {
      demographics,
      interests,
      niche: nicheScore,
      platform: platformScore
    };
  }

  private predictPartnershipPerformance(partners: SuggestedPartnership[], context: PartnershipContext): Record<string, PerformancePrediction> {
    if (!context.niche || !context.targetAudience) {
      throw new Error("Niche and target audience are required to predict partnership performance");
    }

    const predictions: Record<string, PerformancePrediction> = {};
    
    partners.forEach(partner => {
      // Calculate base metrics predictions
      const baseEngagement = this.predictEngagementMetrics(partner, context);
      const baseReach = this.predictReachMetrics(partner, context);
      const baseRevenue = this.predictRevenueMetrics(partner, context);
      
      // Generate timeline predictions
      const timeline = this.generatePerformanceTimeline(partner, context);
      
      // Identify performance factors
      const factors = this.identifyPerformanceFactors(partner, context);
      
      // Calculate overall confidence based on signal strength and historical data
      const confidence = this.calculatePredictionConfidence(partner, context);
      
      predictions[partner.id] = {
        metrics: {
          engagement: baseEngagement,
          reach: baseReach,
          revenue: baseRevenue
        },
        timeline,
        factors,
        confidence
      };
    });

    return predictions;
  }

  private predictEngagementMetrics(
    partner: SuggestedPartnership,
    context: PartnershipContext
  ): PerformancePrediction['metrics']['engagement'] {
    const baseEngagement = partner.signals.comments * 3 + partner.signals.likes + partner.signals.dms * 2;
    const confidence = partner.confidence / 100;
    
    return {
      predicted: Math.round(baseEngagement * 1.5), // Expect 50% growth
      confidence: Math.round(confidence * 100),
      range: {
        min: Math.round(baseEngagement * 1.2), // Minimum 20% growth
        max: Math.round(baseEngagement * 2.0)  // Maximum 100% growth
      }
    };
  }

  private predictReachMetrics(
    partner: SuggestedPartnership,
    context: PartnershipContext
  ): PerformancePrediction['metrics']['reach'] {
    const baseReach = (partner.signals.likes + partner.signals.comments) * 100; // Assume each engagement represents 100 views
    const confidence = (partner.confidence * 0.8) / 100; // Slightly lower confidence for reach predictions
    
    return {
      predicted: Math.round(baseReach * 1.3), // Expect 30% growth
      confidence: Math.round(confidence * 100),
      range: {
        min: Math.round(baseReach * 1.1), // Minimum 10% growth
        max: Math.round(baseReach * 1.5)  // Maximum 50% growth
      }
    };
  }

  private predictRevenueMetrics(
    partner: SuggestedPartnership,
    context: PartnershipContext
  ): PerformancePrediction['metrics']['revenue'] {
    // Extract numeric value from potentialValue string (assuming format like "$1000")
    const baseValue = parseInt(partner.potentialValue.replace(/[^0-9]/g, ''));
    const confidence = (partner.confidence * 0.7) / 100; // Lower confidence for revenue predictions
    
    return {
      predicted: Math.round(baseValue * 1.2), // Expect 20% growth
      confidence: Math.round(confidence * 100),
      range: {
        min: Math.round(baseValue * 0.9),  // Account for potential 10% underperformance
        max: Math.round(baseValue * 1.5)   // Maximum 50% growth
      }
    };
  }

  private generatePerformanceTimeline(
    partner: SuggestedPartnership,
    context: PartnershipContext
  ): PerformancePrediction['timeline'] {
    return {
      shortTerm: "Initial engagement boost of 20-30% in first month",
      mediumTerm: "Sustained growth of 40-50% over 3-6 months",
      longTerm: "Potential for 2-3x growth in engagement and reach over 12 months"
    };
  }

  private identifyPerformanceFactors(
    partner: SuggestedPartnership,
    context: PartnershipContext
  ): PerformancePrediction['factors'] {
    const positive = [
      `Strong engagement signals with ${partner.signals.comments} comments`,
      `Active audience with ${partner.signals.likes} likes`,
      `Direct communication potential with ${partner.signals.dms} DMs`,
      `High confidence score of ${partner.confidence}%`
    ];

    const negative = [
      partner.signals.comments < 10 ? "Low comment engagement" : null,
      partner.signals.dms < 5 ? "Limited direct communication" : null,
      partner.confidence < 80 ? "Moderate confidence score" : null
    ].filter(Boolean) as string[];

    const risks = [
      partner.signals.comments < 5 ? "Risk of low audience interaction" : null,
      partner.confidence < 70 ? "Risk of partnership misalignment" : null,
      "Market conditions may affect performance",
      "Audience preferences may shift"
    ].filter(Boolean) as string[];

    return {
      positive,
      negative,
      risks
    };
  }

  private calculatePredictionConfidence(
    partner: SuggestedPartnership,
    context: PartnershipContext
  ): number {
    const signalStrength = (
      (partner.signals.comments * 0.4) +
      (partner.signals.likes * 0.3) +
      (partner.signals.dms * 0.3)
    ) / 100;

    const baseConfidence = partner.confidence;
    const metricsConfidence = Object.values(context.metrics)
      .reduce((sum, metric) => sum + (metric?.engagement || 0), 0) / 
      Object.keys(context.metrics).length;

    return Math.round(
      (signalStrength * 0.4 + baseConfidence * 0.4 + metricsConfidence * 0.2)
    );
  }
} 