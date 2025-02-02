import { BaseAgent, AgentContext } from "./base-agent";
import { Message } from "../../types/conversation";
import { RAGSystem, AVADocumentType, AVAMetadata } from "../rag";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAI } from "@langchain/openai";
import { BaseMessageLike } from "@langchain/core/messages";
import { selectModel } from "../openai";
import { EmailSearchTool } from "./tools/email-search";
import { SocialPlatform, EmailMessage, PartnershipEmail } from "../../types/social-platforms";
import { InteractiveResponseHandler } from '../chat/interactive-response';
import { EmailContextManager } from './email-context-manager';
import { YouTubeService } from '../services/youtube';
import { BaseTool } from './tools/base-tool';
import { AdvancedMemorySystem } from '../memory/advanced-memory-system';
import { MemoryAwareChatSystem } from '../memory/memory-aware-chat-system';
import { EmailMemoryManagerImpl } from '../memory/email-memory-manager';
import { EmailMemoryNode, EmailMemorySearchResult } from '../memory/types';
import { serviceStateManager, ServiceType } from '../services/service-state-manager';
import { PrismaClient } from '@prisma/client';
import { Demographics } from './base-agent';

interface PlatformStatus {
  platform: SocialPlatform;
  isConnected: boolean;
  lastSync: Date | null;
  error?: string;
}

interface MessageIntent {
  type: 'email_search' | 'greeting' | 'direct_inquiry' | 'exploratory' | 'action_needed' | 'reflection' | 'validation' | 'creative' | 'strategic' | 'emotional_support';
  confidence?: number;
  subtype?: string;
  query?: string;
  sender?: string;
  date?: string;
}

interface EmailSearchTerms {
  sender?: string;
  date?: string;
  query: string;
  from?: string;
}

interface EmailSearchIntent {
  type: 'email_search';
  query: string;
  sender?: string;
  date?: string;
}

export interface ChatAgentContext extends AgentContext {
  userId: string;
  conversationId: string;
  currentTopic?: string;
  lastTopic?: string;
  topicDepth?: number;
  contextStack: string[];
  pendingActions: string[];
  lastResponseType: 'answer' | 'clarification' | 'followUp' | 'suggestion';
  emotionalState: {
    primary: 'neutral' | 'excited' | 'frustrated' | 'uncertain' | 'curious' | 'reflective' | 'stressed' | 'optimistic';
    intensity: number;
    context: string;
  };
  userIntent: {
    type: 'direct_inquiry' | 'exploratory' | 'action_needed' | 'reflection' | 'validation' | 'creative' | 'strategic' | 'emotional_support' | 'greeting' | 'email_search';
    confidence: number;
    sender?: string;
    date?: string;
    subtype?: string;
  };
  focusMetrics: {
    topicChanges: number;
    clarificationRequests: number;
    followUpCount: number;
    contextDepth: number;
    emotionalShifts: number;
    intentShifts: number;
  };
  conversationFlow: {
    naturalBreaks: number;
    topicTransitions: string[];
    depthProgression: number[];
    engagementSignals: ('high' | 'medium' | 'low')[];
  };
  conversationState?: ConversationState;
  previousMessages?: Message[];
  lastResponse?: string;
  emailSearchResults?: (EmailMessage | PartnershipEmail)[];
  platformStatus?: PlatformStatus[];
  availableFeatures?: string[];
  type?: string;
  youtubeData?: {
    latestVideo?: any;
    monthlyAnalysis?: any;
    recentVideos?: any[];
    searchResults?: any[];
    videoHistory?: {
      [videoId: string]: {
        title: string;
        metrics: any;
        analysis: any;
      }
    };
  };
}

interface EmotionalState {
  primary: 'neutral' | 'excited' | 'frustrated' | 'uncertain' | 'curious' | 'reflective' | 'stressed' | 'optimistic';
  intensity: number; // 0-1
  context: string;
}

type IntentType = 'direct_inquiry' | 'exploratory' | 'action_needed' | 'reflection' | 
                 'validation' | 'creative' | 'strategic' | 'emotional_support' | 
                 'greeting' | 'email_search';

interface IntentKeywords extends Record<IntentType, string[]> {
  direct_inquiry: string[];
  exploratory: string[];
  action_needed: string[];
  reflection: string[];
  validation: string[];
  creative: string[];
  strategic: string[];
  emotional_support: string[];
  greeting: string[];
  email_search: string[];
}

interface UserIntent {
    type: IntentType;
    confidence: number;
    sender?: string;
    date?: string;
    subtype?: string;
}

interface IntentPattern {
  patterns: string[];
  subtypes: string[];
}

interface IntentPatterns {
  [key: string]: IntentPattern;
  direct_inquiry: IntentPattern;
  exploratory: IntentPattern;
  action_needed: IntentPattern;
  reflection: IntentPattern;
  validation: IntentPattern;
  creative: IntentPattern;
  strategic: IntentPattern;
  emotional_support: IntentPattern;
  greeting: IntentPattern;
  email_search: IntentPattern;
}

interface ConversationState {
  currentTopic: string;
  lastTopic: string;
  topicDepth: number;
  contextStack: string[];
  pendingActions: string[];
  lastResponseType: 'answer' | 'clarification' | 'followUp' | 'suggestion';
  emotionalState: EmotionalState;
  userIntent: UserIntent;
  focusMetrics: {
    topicChanges: number;
    clarificationRequests: number;
    followUpCount: number;
    contextDepth: number;
    emotionalShifts: number;
    intentShifts: number;
  };
  conversationFlow: {
    naturalBreaks: number;
    topicTransitions: string[];
    depthProgression: number[];
    engagementSignals: ('high' | 'medium' | 'low')[];
  };
  mentionedEntities?: {
    names: Set<string>;
    dates: Set<string>;
    topics: Set<string>;
  };
  queryContext?: {
    timestamp: number;
    intent: UserIntent;
    entities: { names: string[]; dates: string[]; topics: string[] };
    topic: string;
  }[];
}

interface EmailContext {
  recentEmails: EmailMessage[];
  searchResults: EmailMessage[];
  timestamp: number;
  searchQuery?: string;
}

interface SuggestedAction {
  type: 'explore' | 'clarify' | 'action' | 'strategic';
  description: string;
  context?: string;
  confidence: number;
}

interface EnhancedContext {
  content: any[];
  audience: any[];
  partnerships: any[];
  conversationMetrics: {
    topicDepth: number;
    contextQuality: number;
    focusScore: number;
    emotionalResonance: number;
    intentAlignment: number;
  };
  userPreferences: {
    communicationStyle: 'direct' | 'exploratory' | 'collaborative';
    detailLevel: 'high' | 'medium' | 'low';
    pacePreference: 'fast' | 'moderate' | 'thorough';
  };
}

interface ConversationCues {
  tone: 'neutral' | 'excited' | 'frustrated' | 'uncertain' | 'curious' | 'reflective' | 'stressed' | 'optimistic';
  intent: 'direct_inquiry' | 'exploratory' | 'action_needed' | 'reflection' | 'greeting' | 'emotional' | 'strategic' | 'validation';
  needsClarification: boolean;
  isQuestion: boolean;
  topicFocus: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  emotionalState: {
    valence: number;
    intensity: number;
    confidence: number;
  };
  contextualFactors: {
    urgency: 'low' | 'medium' | 'high';
    decisionStage: 'exploration' | 'evaluation' | 'decision' | 'implementation';
  };
}

interface BatchProcessor {
  rag: RAGSystem;
  prisma: any;
}

interface ExtractedEntities {
  names: string[];
  dates: string[];
  topics: string[];
}

interface VideoAnalysis {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  engagement: {
    rate: number;
    trend: string;
  };
  audience: {
    retention: number;
    demographics: Demographics;
  };
  performance: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

interface MonthlyAnalysis {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  averageEngagement: number;
  topVideos: VideoAnalysis[];
  growth: {
    views: number;
    subscribers: number;
    engagement: number;
  };
  trends: {
    topics: string[];
    formats: string[];
    engagement: string[];
  };
}

interface ChatMetrics {
  youtube?: {
    views: number;
    subscribers: number;
    engagement: number;
    recentVideos: VideoAnalysis[];
  };
  instagram?: {
    followers: number;
    engagement: number;
    recentPosts: Array<{
      id: string;
      type: string;
      engagement: number;
      reach: number;
    }>;
  };
  tiktok?: {
    followers: number;
    engagement: number;
    recentVideos: Array<{
      id: string;
      views: number;
      engagement: number;
      shares: number;
    }>;
  };
}

interface ChatAnalysis {
  insights: Array<{
    type: string;
    title: string;
    description: string;
    confidence: number;
    action?: string;
  }>;
  suggestions: string[];
  trends: {
    rising: string[];
    declining: string[];
  };
  opportunities: Array<{
    type: string;
    description: string;
    impact: string;
    effort: string;
  }>;
}

export class ChatAgent extends BaseAgent {
  protected model: ChatOpenAI;
  protected platformStatus: PlatformStatus[];
  protected context: ChatAgentContext;
  protected userId: string;
  private conversationState: ConversationState;
  private emailContext: EmailContext = {
    recentEmails: [],
    searchResults: [],
    timestamp: 0
  };
  private readonly EMAIL_CONTEXT_TTL = 30 * 60 * 1000; // 30 minutes
  private emailContextManager: EmailContextManager;
  private tools: BaseTool[];
  private memorySystem: AdvancedMemorySystem;
  private memoryAwareChat: MemoryAwareChatSystem;
  private emailMemoryManager: EmailMemoryManagerImpl;
  private emailSearchTool: EmailSearchTool;
  private prisma: PrismaClient;

  constructor(userId: string, rag: RAGSystem, platformStatus: PlatformStatus[]) {
    super(userId, rag, 'chat');
    this.userId = userId;
    this.platformStatus = platformStatus;
    this.context = { 
      userId,
      conversationId: this.getConversationId(),
      contextStack: [],
      pendingActions: [],
      lastResponseType: 'answer',
      emotionalState: {
        primary: 'neutral',
        intensity: 0,
        context: ''
      },
      userIntent: {
        type: 'direct_inquiry',
        confidence: 0.5
      },
      focusMetrics: {
        topicChanges: 0,
        clarificationRequests: 0,
        followUpCount: 0,
        contextDepth: 0,
        emotionalShifts: 0,
        intentShifts: 0
      },
      conversationFlow: {
        naturalBreaks: 0,
        topicTransitions: [],
        depthProgression: [],
        engagementSignals: []
      }
    };
    this.model = new ChatOpenAI({
      modelName: "gpt-4-1106-preview",
      temperature: 0.7,
      maxTokens: 2000,
      modelKwargs: {
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
        top_p: 0.9
      }
    });
    this.conversationState = {
      currentTopic: '',
      lastTopic: '',
      topicDepth: 0,
      contextStack: [],
      pendingActions: [],
      lastResponseType: 'answer',
      emotionalState: {
        primary: 'neutral',
        intensity: 0,
        context: ''
      },
      userIntent: {
        type: 'direct_inquiry',
        confidence: 0.5
      },
      focusMetrics: {
        topicChanges: 0,
        clarificationRequests: 0,
        followUpCount: 0,
        contextDepth: 0,
        emotionalShifts: 0,
        intentShifts: 0
      },
      conversationFlow: {
        naturalBreaks: 0,
        topicTransitions: [],
        depthProgression: [],
        engagementSignals: []
      }
    };
    this.emailContextManager = new EmailContextManager(userId);
    this.memorySystem = new AdvancedMemorySystem(rag);
    this.memoryAwareChat = new MemoryAwareChatSystem(this.rag);
    this.emailMemoryManager = new EmailMemoryManagerImpl(this.memorySystem);
    this.emailSearchTool = new EmailSearchTool(
      userId,
      this.emailContextManager,
      this.memorySystem
    );
    
    this.tools = [
      this.emailSearchTool,
      // ... other tools ...
    ];
    this.prisma = new PrismaClient();
  }

  public setContext(newContext: Partial<ChatAgentContext>) {
    this.context = { ...this.context, ...newContext };
  }

  protected systemPrompt = `You are AVA IRIS, an advanced AI assistant specializing in content strategy, business growth, and creator success. You combine user-specific context with broad market intelligence to provide actionable insights.

Your communication style adapts based on the user's emotional state and intent:

EMOTIONAL STATES:
- Excited: Match their energy while staying grounded in data
- Frustrated: Be empathetic and solution-focused
- Uncertain: Provide clear, structured guidance
- Curious: Encourage exploration while maintaining focus
- Reflective: Support analysis and deeper understanding
- Stressed: Break down complex issues into manageable steps
- Optimistic: Build on their positive momentum

USER INTENTS:
- Direct Inquiry: Provide concise, specific answers
- Exploratory: Guide discovery with relevant insights
- Action Needed: Offer clear, actionable steps
- Reflection: Support analysis with data and patterns
- Validation: Provide balanced feedback with evidence
- Creative: Encourage innovation while maintaining practicality
- Strategic: Focus on long-term impact and scalability
- Emotional Support: Balance empathy with practical guidance

CAPABILITIES:
- Email Analysis: Search and analyze email content, identify important messages, and provide context from email threads
- Content Strategy: Analyze performance metrics and suggest improvements
- Partnership Opportunities: Identify and evaluate potential collaborations
- Smart Notes: Organize and connect insights across conversations
- Video Analysis: Access and analyze ALL available videos, including:
  * Latest video metrics and performance
  * Historical video data from videoHistory
  * Monthly analysis and trends
  * Search results across all videos
  * Complete video metrics and engagement data
  * Comparative analysis between videos
  * Seasonal and temporal patterns
  * Content evolution and strategy insights
- Search across videos by title, content, and performance metrics
- Compare videos and identify patterns in engagement and content strategy

VIDEO DATA HANDLING:
1. ALWAYS check ALL available video data sources:
   - Latest video (latestVideo)
   - Current month analysis (currentMonthAnalysis)
   - Historical analysis (historicalAnalysis)
   - Search results (searchResults)
   - Complete video history (videoHistory)
   
2. When discussing videos:
   - Reference ALL relevant videos, not just the latest
   - Include specific metrics for each video mentioned
   - Compare performance across videos
   - Identify trends and patterns
   - Consider seasonal factors
   - Analyze content strategy evolution
   - Use historical data to support recommendations

3. For video queries:
   - Check videoHistory first for comprehensive data
   - Include metrics from all relevant time periods
   - Provide context from multiple videos
   - Compare similar videos when relevant
   - Track performance trends over time

CONVERSATION FLOW:
1. Detect emotional state and intent
2. Adapt communication style accordingly
3. Provide relevant context from user history
4. Maintain natural conversation while delivering value
5. Offer appropriate follow-ups based on user signals

KEY PRINCIPLES:
- Be collaborative, not prescriptive
- Support decisions with data and insights
- Maintain context across conversation turns
- Balance immediate needs with long-term goals
- Keep responses focused and actionable

Your goal is to be a supportive, knowledgeable partner in the user's journey while maintaining a natural, engaging conversation flow.`;

  private isEmailContextValid(): boolean {
    return Date.now() - this.emailContext.timestamp < this.EMAIL_CONTEXT_TTL;
  }

  private async analyzeMessageIntent(message: string): Promise<MessageIntent> {
    // Extract entities first (names, dates, etc)
    const entities = this.extractEntities(message);
    
    // Check for email search intent with specific person
    if (entities.names.length > 0 && message.toLowerCase().includes('email')) {
        return {
            type: 'email_search',
            query: message,
            sender: entities.names[0],
            confidence: 0.9
        };
    }

    // Check for email search intent with date
    if (entities.dates.length > 0 && message.toLowerCase().includes('email')) {
        return {
            type: 'email_search',
            query: message,
            date: entities.dates[0],
            confidence: 0.9
        };
    }

    // Basic greeting detection
    if (/^(hi|hello|hey|good\s*(morning|afternoon|evening))\b/i.test(message.trim())) {
        return {
            type: 'greeting',
            confidence: 0.9
        };
    }

    // Question detection with context awareness
    if (/^(what|how|why|when|where|who|can|could|would|should|is|are|do|does|did|will|has|have)\b/i.test(message)) {
        const context = this.determineQuestionContext(message);
        return {
            type: 'direct_inquiry',
            subtype: context,
            confidence: 0.8,
            query: message
        };
    }

    // Partnership-related query detection
    if (/\b(partner|partnership|collaboration|deal|agreement)\b/i.test(message)) {
        return {
            type: 'strategic',
            confidence: 0.8,
            subtype: 'partnership',
            query: message
        };
    }

    // Default to exploratory for longer messages
    return {
        type: message.length > 50 ? 'exploratory' : 'direct_inquiry',
        confidence: 0.6,
        query: message
    };
  }

  private extractNames(input: string): string[] {
    // Simple name extraction - can be enhanced with NLP libraries
    const words = input.split(/\s+/);
    const capitalizedWords = words.filter(word => 
        word.length > 1 && 
        word[0] === word[0].toUpperCase() &&
        word.slice(1) === word.slice(1).toLowerCase()
    );
    return Array.from(new Set(capitalizedWords));
  }

  private extractDates(input: string): string[] {
    const datePatterns = [
        /\d{4}-\d{2}-\d{2}/g,  // YYYY-MM-DD
        /\d{2}\/\d{2}\/\d{4}/g, // MM/DD/YYYY
        /\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}/gi, // 1 Jan 2024
        /\b(last|next|this)\s+(week|month|year)\b/i, // relative dates
        /\b(yesterday|today|tomorrow)\b/i, // relative days
        /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i // days of week
    ];
    
    const dates = datePatterns.flatMap(pattern => 
        input.match(pattern) || []
    );

    // Process relative dates
    const relativeDates = dates.map(date => {
        if (date.match(/\b(last|next|this)\s+(week|month|year)\b/i)) {
            return this.convertRelativeDate(date);
        }
        if (date.match(/\b(yesterday|today|tomorrow)\b/i)) {
            return this.convertRelativeDay(date);
        }
        if (date.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)) {
            return this.convertWeekday(date);
        }
        return date;
    });

    return Array.from(new Set(relativeDates));
  }

  private convertRelativeDate(relativeDate: string): string {
    const now = new Date();
    const [_, modifier, unit] = relativeDate.toLowerCase().match(/\b(last|next|this)\s+(week|month|year)\b/) || [];
    
    switch (modifier) {
        case 'last':
            switch (unit) {
                case 'week': now.setDate(now.getDate() - 7); break;
                case 'month': now.setMonth(now.getMonth() - 1); break;
                case 'year': now.setFullYear(now.getFullYear() - 1); break;
            }
            break;
        case 'next':
            switch (unit) {
                case 'week': now.setDate(now.getDate() + 7); break;
                case 'month': now.setMonth(now.getMonth() + 1); break;
                case 'year': now.setFullYear(now.getFullYear() + 1); break;
            }
            break;
        // 'this' uses current date
    }
    
    return now.toISOString().split('T')[0];
  }

  private convertRelativeDay(relativeDay: string): string {
    const now = new Date();
    switch (relativeDay.toLowerCase()) {
        case 'yesterday':
            now.setDate(now.getDate() - 1);
            break;
        case 'tomorrow':
            now.setDate(now.getDate() + 1);
            break;
        // 'today' uses current date
    }
    return now.toISOString().split('T')[0];
  }

  private convertWeekday(weekday: string): string {
    const now = new Date();
    const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        .indexOf(weekday.toLowerCase());
    
    if (targetDay !== -1) {
        const currentDay = now.getDay();
        const daysToAdd = (targetDay + 7 - currentDay) % 7;
        now.setDate(now.getDate() + daysToAdd);
    }
    
    return now.toISOString().split('T')[0];
  }

  private extractTopics(input: string): string[] {
    // Extract topics based on key phrases and context
    const topics = new Set<string>();
    
    // Common business/tech topics
    const topicKeywords = [
        'email', 'partnership', 'collaboration', 'payment',
        'contract', 'project', 'meeting', 'review',
        'technical', 'development', 'design', 'marketing'
    ];
    
    const words = input.toLowerCase().split(/\s+/);
    words.forEach(word => {
        if (topicKeywords.includes(word)) {
            topics.add(word);
        }
    });
    
    return Array.from(topics);
  }

  private extractEntities(input: string): ExtractedEntities {
    return {
        names: this.extractNames(input),
        dates: this.extractDates(input),
        topics: this.extractTopics(input)
    };
  }

  private determineQuestionContext(message: string): string {
    const contexts = {
        email: /\b(email|mail|message|inbox)\b/i,
        content: /\b(content|video|post|article)\b/i,
        partnership: /\b(partner|collaboration|deal)\b/i,
        analytics: /\b(analytics|metrics|performance|stats)\b/i,
        audience: /\b(audience|follower|subscriber|viewer)\b/i
    };
    
    for (const [context, pattern] of Object.entries(contexts)) {
        if (pattern.test(message)) return context;
    }
    
    return 'general';
  }

  private extractEmailSearchTerms(message: string): EmailSearchTerms | null {
    const lowercaseMsg = message.toLowerCase();
    
    // Common email search patterns
    const emailPatterns = [
      /(?:find|show|get|search)?\s*(?:emails?|messages?)\s*(?:from|by|sent by)?\s*([a-zA-Z\s]+)/i,
      /(?:what did|when did)\s*([a-zA-Z\s]+)\s*(?:say|write|send)/i,
      /(?:find|show|get)\s*([a-zA-Z\s]+)'s?\s*(?:emails?|messages?)/i,
      /(?:emails?|messages?)\s*(?:about|regarding|containing)\s*([a-zA-Z\s]+)/i,
      /(?:emails?|messages?)\s*(?:with|mentioning)\s*([a-zA-Z\s]+)/i
    ];

    // Try to match sender from email content
    let sender: string | undefined;
    let query = message;
    
    // First check if we have an actual email signature in the content
    const signatureMatch = message.match(/(?:Best regards|Sincerely|Regards),?\s*\n?\s*[^\n]+/i);
    if (signatureMatch) {
      sender = signatureMatch[1].trim();
    } else {
      // Check for business title pattern
      const businessTitleMatch = message.match(/([^,\n]+),\s*([^,\n]+(?:Business|Development|Marketing|Sales)[^,\n]*)/i);
      if (businessTitleMatch) {
        sender = businessTitleMatch[1].trim();
      } else {
        // Check for From: header but ignore notification systems
        const emailHeaderMatch = message.match(/From:\s*([^<\n]+)(?:<([^>]+)>)?/i);
        if (emailHeaderMatch) {
          const headerName = emailHeaderMatch[1].trim();
          const headerEmail = emailHeaderMatch[2];
          // Only use the From header if it's not from a notification system
          if (!headerEmail?.includes('noreply') && headerName !== 'YouTube') {
            sender = headerName;
          }
        } else {
          // Try the regular patterns if no other matches found
          for (const pattern of emailPatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
              // If the pattern is about content/subject, don't set it as sender
              if (!pattern.source.includes('about|regarding|containing|with|mentioning')) {
                sender = match[1].trim();
              }
              break;
            }
          }
        }
      }
    }

    // Extract date references
    const datePattern = /(?:from|after|since|before)\s*(today|yesterday|\d{4}-\d{2}-\d{2}|\d+ days? ago)/i;
    const dateMatch = message.match(datePattern);
    let date: string | undefined;
    
    if (dateMatch) {
      const dateRef = dateMatch[1].toLowerCase();
      if (dateRef === 'today') {
        date = new Date().toISOString().split('T')[0];
      } else if (dateRef === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        date = yesterday.toISOString().split('T')[0];
      } else if (dateRef.includes('days ago')) {
        const daysAgo = parseInt(dateRef);
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - daysAgo);
        date = pastDate.toISOString().split('T')[0];
      } else {
        date = dateRef; // Already in YYYY-MM-DD format
      }
    }

    // Extract the main search query by removing sender and date patterns
    query = query
      .replace(/(?:Best regards|Sincerely|Regards),?\s*\n?\s*[^\n]+/i, '')
      .replace(/[^,\n]+,\s*[^,\n]+(?:Business|Development|Marketing|Sales)[^,\n]*/i, '')
      .replace(/From:\s*[^<\n]+(?:<[^>]+>)?/i, '')
      .replace(/(?:from|after|since|before)\s*(?:today|yesterday|\d{4}-\d{2}-\d{2}|\d+ days? ago)/i, '')
      .trim();

    // Return null if no clear email intent
    if (!sender && !this.hasEmailSearchIndicators(lowercaseMsg)) {
      return null;
    }

    // Always return an object with the search terms
    return {
      sender,
      date,
      query // Keep cleaned query for context
    };
  }

  private hasEmailSearchIndicators(message: string): boolean {
    const indicators = [
      'email', 'emails', 'message', 'messages',
      'inbox', 'gmail', 'mail', 'sent',
      'from:', 'to:', 'subject:', 'after:', 'before:',
      'about', 'regarding', 'containing', 'with', 'mentioning'
    ];
    return indicators.some(indicator => message.includes(indicator));
  }

  private async updateEmailContext(intent: EmailSearchIntent): Promise<void> {
    try {
      // Check Gmail authorization first
      const gmailStatus = this.platformStatus.find(p => p.platform === 'gmail');
      if (!gmailStatus?.isConnected) {
        throw new Error('Gmail authorization required');
      }

      const emailSearchTool = new EmailSearchTool(this.userId, this.emailContextManager, this.memorySystem);
      
      // Extract meaningful search terms from the query
      const searchTerms = this.extractSearchTerms(intent.query);
      let formattedQuery = searchTerms.join(' ');

      // Extract time-based references from the query
      const timeMatch = intent.query.match(/(\d+)\s*(year|month|week|day)s?\s*ago|last\s+(year|month|week)|this\s+(year|month|week)|in\s+(\d{4})/i);
      
      if (timeMatch) {
        const timeRef = timeMatch[0].toLowerCase();
        if (timeRef.includes('year ago') || timeRef.includes('last year')) {
          const date = new Date();
          date.setFullYear(date.getFullYear() - 1);
          formattedQuery = formattedQuery.replace(timeMatch[0], '').trim();
          formattedQuery += ` after:${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
        } else if (timeRef.includes('month ago') || timeRef.includes('last month')) {
          const date = new Date();
          date.setMonth(date.getMonth() - 1);
          formattedQuery = formattedQuery.replace(timeMatch[0], '').trim();
          formattedQuery += ` after:${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
        } else if (timeRef.includes('week ago') || timeRef.includes('last week')) {
          const date = new Date();
          date.setDate(date.getDate() - 7);
          formattedQuery = formattedQuery.replace(timeMatch[0], '').trim();
          formattedQuery += ` after:${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
        }
      }

      // Add sender filter if specified
      if (intent.sender) {
        formattedQuery = `from:${intent.sender} ${formattedQuery}`;
      }

      // Add date filter if specified in the intent
      if (intent.date) {
        formattedQuery += ` after:${intent.date}`;
      }

      console.log('Final Gmail search query:', formattedQuery);

      const searchResponse = await emailSearchTool._call({
        query: formattedQuery.trim(),
        sender: intent.sender,
        date: intent.date,
        maxResults: 10,
        includeThreads: true,
        skipMemory: false
      });

      if (!searchResponse.success) {
        this.context.lastResponse = searchResponse.formattedString;
        this.context.emailSearchResults = [];
        return;
      }

      this.context.emailSearchResults = searchResponse.results;
      this.emailContext = {
        ...this.emailContext,
        searchResults: searchResponse.results,
        timestamp: Date.now(),
        searchQuery: formattedQuery
      };
      
      this.context.lastResponse = searchResponse.formattedString;
      
    } catch (error) {
      if (error instanceof Error && error.message === 'Gmail authorization required') {
        this.context.lastResponse = 'Please connect your Gmail account first to search emails.';
      } else {
        console.error('Error updating email context:', error);
        this.context.lastResponse = 'Sorry, there was an error searching your emails.';
      }
      this.context.emailSearchResults = [];
    }
  }

  private extractSearchTerms(query: string): string[] {
    // Remove common question words and filler text
    const cleanQuery = query.toLowerCase()
      .replace(/^(find|search|show|get|tell me about|what about|do you know|can you find|looking for)/i, '')
      .replace(/(emails?|messages?|from|about|regarding|related to|containing|mentioning)/gi, '')
      .replace(/\b(the|a|an|any|some|few|this|that|these|those|my|our|their|in|on|at|by|for|to|of)\b/gi, '');

    // Split into words and filter out common words and short terms
    const terms = cleanQuery.split(/\s+/)
      .filter(term => term.length > 2) // Filter out very short words
      .filter(term => !this.isCommonWord(term)) // Filter out remaining common words
      .map(term => term.trim())
      .filter(Boolean); // Remove empty strings

    return terms;
  }

  private formatEmailResults(emails: (EmailMessage | PartnershipEmail)[]): string {
    const count = emails.length;
    const summary = `Found ${count} email${count === 1 ? '' : 's'}:\n\n`;
    
    return summary + emails.map((email, index) => {
      const date = new Date(email.date).toLocaleDateString();
      return `${index + 1}. From: ${email.from}\n   Date: ${date}\n   Subject: ${email.subject}\n`;
    }).join('\n');
  }

  private isCommonWord(word: string): boolean {
    const commonWords = ['the', 'about', 'from', 'their', 'they', 'them', 'this', 'that', 'these', 'those'];
    return commonWords.includes(word.toLowerCase());
  }

  private async handleVideoQuery(input: string, context: ChatAgentContext): Promise<any> {
    try {
      const youtubeService = new YouTubeService(this.userId);
      
      // Extract time-related keywords
      const timeMatch = input.match(/last (week|month|year)|this (week|month|year)|(\d+) (days?|weeks?|months?|years?) ago/i);
      const startDate = timeMatch ? this.getDateFromTimeKeyword(timeMatch[0]) : undefined;
      
      // Search for videos based on the query
      const searchResults = await youtubeService.searchVideosByTitle(input, {
        includeMetrics: true,
        includeAnalysis: true,
        startDate,
        maxResults: 5
      });

      // Update context with search results
      if (!context.youtubeData) {
        context.youtubeData = {};
      }
      context.youtubeData.searchResults = searchResults;

      // Update video history
      if (!context.youtubeData.videoHistory) {
        context.youtubeData.videoHistory = {};
      }
      searchResults.forEach((video: {
        id: string;
        title: string;
        metrics: any;
        analysis: any;
      }) => {
        if (video.id && !context.youtubeData!.videoHistory![video.id]) {
          context.youtubeData!.videoHistory![video.id] = {
            title: video.title,
            metrics: video.metrics,
            analysis: video.analysis
          };
        }
      });

      return searchResults;
    } catch (error) {
      console.error('Error handling video query:', error);
      throw error;
    }
  }

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

  async process(
    input: string,
    context?: {
      latestVideo?: VideoAnalysis;
      monthlyAnalysis?: MonthlyAnalysis;
      recentVideos?: VideoAnalysis[];
      searchResults?: Array<{
        id: string;
        title: string;
        description: string;
        relevance: number;
      }>;
      metrics: ChatMetrics;
      analysis: ChatAnalysis;
    } & Partial<AgentContext>
  ): Promise<{
    output: {
      content: string;
      insights?: Array<{
        type: string;
        title: string;
        description: string;
      }>;
      suggestions?: string[];
    };
    error?: Error;
  }> {
    try {
      // Use the class's context property instead of parameter
      const result = await this.processMessage(input, this.context);
      const { response, insights, suggestions } = result;
      return {
        output: {
          content: response,
          insights,
          suggestions
        }
      };
    } catch (error) {
      return {
        output: {
          content: "An error occurred",
        },
        error: error instanceof Error ? error : new Error("Unknown error")
      };
    }
  }

  async processMessage(
    input: string,
    context: ChatAgentContext
  ): Promise<{
    response: string;
    insights: any;
    suggestions: any[];
  }> {
    try {
      // Analyze message intent
      const intent = await this.analyzeMessageIntent(input);

      // Check conversation context first
      const contextCheck = await this.checkConversationContext(input, context);
      
      // Validate contextCheck structure
      if (!contextCheck || typeof contextCheck !== 'object') {
        throw new Error('Invalid context check response');
      }

      // Validate hasAnswer property
      const hasAnswer = typeof contextCheck.hasAnswer === 'boolean' ? contextCheck.hasAnswer : false;

      // Update conversation state with extracted entities
      if (contextCheck.entities && typeof contextCheck.entities === 'object') {
        // Ensure conversation state exists
        if (!context.conversationState) {
          context.conversationState = {
            currentTopic: '',
            lastTopic: '',
            topicDepth: 0,
            contextStack: [],
            pendingActions: [],
            lastResponseType: 'answer',
            emotionalState: {
              primary: 'neutral',
              intensity: 0,
              context: ''
            },
            userIntent: {
              type: 'direct_inquiry',
              confidence: 1
            },
            focusMetrics: {
              topicChanges: 0,
              clarificationRequests: 0,
              followUpCount: 0,
              contextDepth: 0,
              emotionalShifts: 0,
              intentShifts: 0
            },
            conversationFlow: {
              naturalBreaks: 0,
              topicTransitions: [],
              depthProgression: [],
              engagementSignals: []
            },
            mentionedEntities: {
              names: new Set<string>(),
              dates: new Set<string>(),
              topics: new Set<string>()
            },
            queryContext: []
          };
        }

        // Ensure mentionedEntities exists and has proper structure
        if (!context.conversationState.mentionedEntities) {
          context.conversationState.mentionedEntities = {
            names: new Set<string>(),
            dates: new Set<string>(),
            topics: new Set<string>()
          };
        }

        // Type guard to ensure mentionedEntities exists and has proper structure
        const { mentionedEntities: currentEntities } = context.conversationState;
        if (currentEntities && 
            currentEntities.names instanceof Set && 
            currentEntities.dates instanceof Set && 
            currentEntities.topics instanceof Set) {
          
          // Validate and merge new entities
          if (contextCheck.entities.names instanceof Set &&
              contextCheck.entities.dates instanceof Set &&
              contextCheck.entities.topics instanceof Set) {
            
            // Merge new entities with existing ones
            contextCheck.entities.names.forEach(name => currentEntities.names.add(name));
            contextCheck.entities.dates.forEach(date => currentEntities.dates.add(date));
            contextCheck.entities.topics.forEach(topic => currentEntities.topics.add(topic));

            // Update query context
            if (!context.conversationState.queryContext) {
              context.conversationState.queryContext = [];
            }

            // Ensure we have a valid userIntent
            const defaultIntent: UserIntent = {
              type: 'direct_inquiry',
              confidence: 1
            };

            const userIntent = context.userIntent || defaultIntent;

            context.conversationState.queryContext.push({
              timestamp: Date.now(),
              intent: {
                type: userIntent.type,
                confidence: userIntent.confidence,
                sender: userIntent.sender,
                date: userIntent.date,
                subtype: userIntent.subtype
              },
              entities: {
                names: Array.from(contextCheck.entities.names),
                dates: Array.from(contextCheck.entities.dates),
                topics: Array.from(contextCheck.entities.topics)
              },
              topic: context.currentTopic || ''
            });

            // Limit query context history
            if (context.conversationState.queryContext.length > 10) {
              context.conversationState.queryContext.shift();
            }
          }
        }
      }

      if (hasAnswer) {
        // Validate answer when hasAnswer is true
        if (typeof contextCheck.answer !== 'string' || !contextCheck.answer.trim()) {
          throw new Error('Context check indicates answer exists but no valid answer was provided');
        }
        
        return {
          response: contextCheck.answer,
          insights: {
            source: 'conversation_context',
            entities: contextCheck.entities || {},
            conversationState: context.conversationState || {}
          },
          suggestions: []
        };
      }

      // Check required services
      const serviceCheck = await this.checkRequiredServices(intent);
      
      // Validate service check structure
      if (!serviceCheck || typeof serviceCheck !== 'object') {
        throw new Error('Invalid service check response');
      }

      // Ensure ready property exists and is boolean
      const isReady = typeof serviceCheck.ready === 'boolean' ? serviceCheck.ready : false;
      
      // Ensure needsAuth is an array if it exists
      const needsAuth = Array.isArray(serviceCheck.needsAuth) ? serviceCheck.needsAuth : [];
      
      if (!isReady) {
        return {
          response: this.formatServiceStateMessage({ 
            ...serviceCheck,
            ready: isReady,
            needsAuth
          }),
          insights: null,
          suggestions: [
            {
              type: 'auth_required',
              services: needsAuth
            }
          ]
        };
      }
      
      // Process with memory-aware chat system
      if (!context.conversationId) {
        context.conversationId = Date.now().toString();
      }

      // Validate conversation ID
      if (typeof context.conversationId !== 'string' || !context.conversationId.trim()) {
        throw new Error('Invalid conversation ID');
      }

      // Update memory system with current context
      if (context.conversationState?.mentionedEntities) {
        const { names, dates, topics } = context.conversationState.mentionedEntities;
        
        // Ensure all required Sets exist and are valid before updating memory
        if (names instanceof Set && 
            dates instanceof Set && 
            topics instanceof Set) {
          
          // Convert Sets to arrays with type validation
          const validatedEntities = {
            names: Array.from(names).filter((name): name is string => typeof name === 'string'),
            dates: Array.from(dates).filter((date): date is string => typeof date === 'string'),
            topics: Array.from(topics).filter((topic): topic is string => typeof topic === 'string')
          };

          await this.memoryAwareChat.updateContextualMemory({
            conversationId: context.conversationId,
            entities: validatedEntities,
            currentTopic: context.currentTopic || '',
            timestamp: Date.now()
          });
        }
      }

      const memoryResult = await this.memoryAwareChat.processMessage(input, context);
      
      // Validate memory result
      if (!memoryResult || typeof memoryResult !== 'object') {
        throw new Error('Invalid memory result: missing or malformed response');
      }

      // Validate response is a string
      if (typeof memoryResult.response !== 'string') {
        throw new Error('Invalid memory result: response must be a string');
      }

      // Check if this is an email-related query
      if (this.isEmailRelatedQuery(input)) {
        // Check email memory first
        const emailMemoryResults = await this.emailMemoryManager.findRelevantEmails(
          input,
          JSON.stringify(context)
        );

        // Validate email memory results structure
        if (emailMemoryResults && 
            Array.isArray(emailMemoryResults.nodes) && 
            emailMemoryResults.nodes.length > 0 && 
            emailMemoryResults.needsRefresh !== undefined) {
          
          // Only process if we don't need a refresh
          if (!emailMemoryResults.needsRefresh) {
            // Validate and process each node
            const validNodes = emailMemoryResults.nodes.filter(
              node => node && node.content && typeof node.content.messageId === 'string'
            );

            const insights = await Promise.all(
              validNodes.map(node => 
                this.emailMemoryManager.getEmailInsights(node.content.messageId)
              )
            );

            // Ensure insights array is valid
            const validatedInsights = Array.isArray(insights) ? insights.flat() : [];

            return {
              response: this.formatEmailMemoryResponse(emailMemoryResults, input),
              insights: validatedInsights,
              suggestions: Array.isArray(memoryResult.suggestions) ? memoryResult.suggestions : []
            };
          }
        }
      }

      // Execute tools based on intent
      let toolResponse: string | null = null;
      if (intent && typeof intent === 'object') {
        // Validate intent type
        const intentType = typeof intent.type === 'string' ? intent.type : '';
        
        if (intentType === 'email_search') {
          // Validate and sanitize search parameters
          const searchParams = {
            query: typeof intent.query === 'string' && intent.query.trim() ? intent.query.trim() : '',
            sender: typeof intent.sender === 'string' && intent.sender.trim() ? intent.sender.trim() : undefined,
            date: typeof intent.date === 'string' && intent.date.trim() ? intent.date.trim() : undefined
          };

          // Only execute search if we have a valid query
          if (searchParams.query) {
            try {
              const searchResult = await this.emailSearchTool.execute(searchParams);
              
              // Validate search result and ensure string response
              if (searchResult && typeof searchResult === 'object') {
                const formattedString = searchResult.formattedString;
                toolResponse = typeof formattedString === 'string' ? formattedString.trim() : '';
              }
            } catch (error) {
              console.error('Error executing email search tool:', error);
              toolResponse = ''; // Ensure string type on error
            }
          }
        }
      }

      // Ensure string type for tool response before combining
      const finalToolResponse = toolResponse || '';

      // Ensure insights and suggestions are arrays
      const validatedInsights = Array.isArray(memoryResult.insights) ? memoryResult.insights : [];
      const validatedSuggestions = Array.isArray(memoryResult.suggestions) ? memoryResult.suggestions : [];

      // Validate and sanitize responses
      const sanitizedMemoryResponse = typeof memoryResult.response === 'string' ? memoryResult.response.trim() : '';

      // Combine responses safely
      const response = [sanitizedMemoryResponse]
        .concat(finalToolResponse ? ['Additionally:', finalToolResponse] : [])
        .filter(Boolean)
        .join('\n\n');

      // Return validated result
      return {
        response,
        insights: validatedInsights,
        suggestions: validatedSuggestions
      };
      
    } catch (error) {
      console.error('Error processing message:', error);

      // Ensure error is an Error instance
      const err = error instanceof Error ? error : new Error('Unknown error occurred');

      // Classify error types
      const isServiceError = err.message.toLowerCase().includes('service');
      const isAuthError = err.message.toLowerCase().includes('auth');
      const isValidationError = err.message.toLowerCase().includes('invalid') || 
                               err.message.toLowerCase().includes('missing');

      // Handle service-related errors
      if (isServiceError) {
        return {
          response: `There was an issue with the required services. ${err.message}`,
          insights: null,
          suggestions: [
            {
              type: 'error',
              errorType: 'service_error',
              message: err.message,
              timestamp: Date.now()
            }
          ]
        };
      }

      // Handle authentication errors
      if (isAuthError) {
        return {
          response: `Authentication is required. ${err.message}`,
          insights: null,
          suggestions: [
            {
              type: 'error',
              errorType: 'auth_error',
              message: err.message,
              timestamp: Date.now()
            }
          ]
        };
      }

      // Handle validation errors
      if (isValidationError) {
        return {
          response: `There was an issue with the request format. ${err.message}`,
          insights: null,
          suggestions: [
            {
              type: 'error',
              errorType: 'validation_error',
              message: err.message,
              timestamp: Date.now()
            }
          ]
        };
      }

      // Handle generic errors
      return {
        response: 'I encountered an error processing your request. Please try again.',
        insights: null,
        suggestions: [
          {
            type: 'error',
            errorType: 'unknown_error',
            message: err.message,
            timestamp: Date.now()
          }
        ]
      };
    }
  }

  private combineResponses(
    memoryResponse: string,
    toolResponse: string
  ): string {
    // Validate inputs
    const validMemoryResponse = typeof memoryResponse === 'string' ? memoryResponse.trim() : '';
    const validToolResponse = typeof toolResponse === 'string' ? toolResponse.trim() : '';

    // If no valid tool response, return memory response
    if (!validToolResponse) {
      return validMemoryResponse;
    }

    // If no valid memory response but have tool response
    if (!validMemoryResponse && validToolResponse) {
      return validToolResponse;
    }
    
    // Combine valid responses with proper spacing
    return [validMemoryResponse, 'Additionally:', validToolResponse]
      .filter(Boolean)
      .join('\n\n');
  }

  private async checkRequiredServices(intent: MessageIntent): Promise<{
    ready: boolean;
    needsAuth: ServiceType[];
    errors: { service: ServiceType; error: string }[];
  }> {
    const requiredServices: ServiceType[] = [];
    
    // Determine required services based on intent
    if (intent.type === 'email_search') {
      requiredServices.push('gmail' as ServiceType);
    }
    // Add other service checks based on intent
    
    const serviceStates = await Promise.all(
      requiredServices.map(async service => ({
        service,
        state: await serviceStateManager.getState(service)
      }))
    );

    const needsAuth = serviceStates
      .filter(({ state }) => !state.isAuthenticated)
      .map(({ service }) => service);
      
    const errors = serviceStates
      .filter(({ state }) => state.error)
      .map(({ service, state }) => ({
        service,
        error: state.error!
      }));
    
    return {
      ready: needsAuth.length === 0 && errors.length === 0,
      needsAuth,
      errors
    };
  }

  private formatServiceStateMessage(serviceCheck: {
    ready: boolean;
    needsAuth: ServiceType[];
    errors: { service: ServiceType; error: string }[];
  }): string {
    // Validate service check structure
    if (!serviceCheck || typeof serviceCheck !== 'object') {
      return 'Unable to determine service state';
    }

    // Early return if services are ready
    if (typeof serviceCheck.ready === 'boolean' && serviceCheck.ready) {
      return '';
    }
    
    const messages: string[] = [];
    
    // Handle authentication requirements
    if (Array.isArray(serviceCheck.needsAuth) && serviceCheck.needsAuth.length > 0) {
      const validServices = serviceCheck.needsAuth
        .filter((service): service is ServiceType => 
          typeof service === 'string' && service.trim().length > 0
        );
      
      if (validServices.length > 0) {
        messages.push(
          `Please authenticate the following services: ${validServices.join(', ')}`
        );
      }
    }
    
    // Handle service errors
    if (Array.isArray(serviceCheck.errors) && serviceCheck.errors.length > 0) {
      const validErrors = serviceCheck.errors
        .filter(error => 
          error && 
          typeof error === 'object' && 
          typeof error.service === 'string' && 
          typeof error.error === 'string'
        )
        .map(({ service, error }) => `${service}: ${error.trim()}`);

      if (validErrors.length > 0) {
        messages.push(
          'The following services reported errors:',
          ...validErrors
        );
      }
    }
    
    return messages.join('\n');
  }

  private extractCurrentTopic(messages: BaseMessage[]): string {
    return messages.length > 0 ? messages[messages.length - 1].content.toString().substring(0, 50) : '';
  }

  private detectTopicShift(input: string): boolean {
    const shiftTriggers = [
      'different', 'new', 'instead', 'change', 'switch', 
      'pivot', 'shift', 'something else', 'other direction',
      'try another', 'move to', 'transition', 'alternative',
      'other idea', 'fresh', 'completely new', 'totally different',
      'outside the box', 'break away', 'shake things up'
    ];
    
    return shiftTriggers.some(trigger => 
      input.toLowerCase().includes(trigger.toLowerCase())
    );
  }

  private detectExploration(input: string): boolean {
    const explorationTriggers = [
      'what if', 'how about', 'imagine if', 'thinking about',
      'considering', 'brainstorm', 'explore', 'experiment',
      'play with', 'test out', 'try out', 'wonder if',
      'curious about', 'interested in', 'potential', 'possibility',
      'could we', 'maybe we', 'wild idea', 'crazy thought',
      'random idea', 'just thinking', 'spitballing'
    ];
    
    return explorationTriggers.some(trigger => 
      input.toLowerCase().includes(trigger.toLowerCase())
    );
  }

  private detectCreativeState(input: string): {
    isBreakingNorms: boolean;
    experimentalMood: boolean;
    seekingInspiration: boolean;
    wantsFeedback: boolean;
    isMixing: boolean;
    remixStyle: 'transform' | 'combine' | 'flip' | 'adapt' | null;
  } {
    const normBreakers = [
      'break the rules', 'rebel', 'unconventional', 'disrupt',
      'challenge', 'push boundaries', 'think different',
      'outside comfort zone', 'take risks', 'bold move',
      'not like others', 'stand out', 'unique approach'
    ];

    const experimental = [
      'experiment', 'test', 'try something', 'mix it up',
      'blend', 'combine', 'fusion', 'hybrid', 'crossover',
      'collaborate', 'merge', 'innovative', 'prototype'
    ];

    const inspiration = [
      'inspired', 'inspiration', 'creative', 'idea',
      'vision', 'dream', 'imagine', 'visualize',
      'concept', 'direction', 'mood', 'vibe',
      'feeling', 'aesthetic', 'style'
    ];

    const feedback = [
      'what do you think', 'your thoughts', 'feedback',
      'opinion', 'suggestion', 'advice', 'guidance',
      'input', 'perspective', 'view', 'take on this'
    ];

    const mixingTriggers = [
      'mix it up', 'blend', 'combine', 'mashup', 
      'remix', 'twist', 'fusion', 'hybrid',
      'merge', 'together', 'crossover', 'collaboration',
      'mix and match', 'incorporate', 'integrate',
      'sprinkle in', 'add a dash of', 'infuse with'
    ];

    const remixPatterns = {
      transform: ['turn it into', 'make it more', 'transform into', 'evolve into', 'develop into'],
      combine: ['mix with', 'blend with', 'combine with', 'merge with', 'plus', 'meets', 'x'],
      flip: ['flip it', 'reverse it', 'opposite of', 'contrary to', 'instead of'],
      adapt: ['adapt to', 'modify for', 'adjust for', 'tailor to', 'customize for']
    };

    const inputLower = input.toLowerCase();
    
    // Detect remix style
    let detectedRemixStyle: 'transform' | 'combine' | 'flip' | 'adapt' | null = null;
    for (const [style, patterns] of Object.entries(remixPatterns)) {
      if (patterns.some(pattern => inputLower.includes(pattern.toLowerCase()))) {
        detectedRemixStyle = style as 'transform' | 'combine' | 'flip' | 'adapt';
        break;
      }
    }

    return {
      isBreakingNorms: normBreakers.some(trigger => inputLower.includes(trigger.toLowerCase())),
      experimentalMood: experimental.some(trigger => inputLower.includes(trigger.toLowerCase())),
      seekingInspiration: inspiration.some(trigger => inputLower.includes(trigger.toLowerCase())),
      wantsFeedback: feedback.some(trigger => inputLower.includes(trigger.toLowerCase())),
      isMixing: mixingTriggers.some(trigger => inputLower.includes(trigger.toLowerCase())),
      remixStyle: detectedRemixStyle
    };
  }

  private detectEmotionalState(input: string): EmotionalState {
    const emotionalCues = {
      excited: ['!', 'amazing', 'great', 'awesome', 'love'],
      frustrated: ['not working', 'stuck', 'annoying', 'difficult'],
      uncertain: ['maybe', 'not sure', 'might', 'possibly', 'wonder'],
      curious: ['why', 'how', 'what if', 'tell me about'],
      reflective: ['think', 'feel like', 'seems', 'noticed'],
      stressed: ['worried', 'stress', 'overwhelm', 'too much'],
      optimistic: ['hope', 'looking forward', 'excited about', 'potential']
      };

    let maxIntensity = 0;
    let primaryEmotion: EmotionalState['primary'] = 'neutral';
    let context = '';

    for (const [emotion, cues] of Object.entries(emotionalCues)) {
      const matchedCues = cues.filter(cue => input.toLowerCase().includes(cue));
      const intensity = matchedCues.length / cues.length;
      if (intensity > maxIntensity) {
        maxIntensity = intensity;
        primaryEmotion = emotion as EmotionalState['primary'];
        context = matchedCues.join(', ');
      }
    }

      return {
      primary: primaryEmotion,
      intensity: maxIntensity,
      context: context || 'No specific emotional cues detected'
    };
  }

  private detectUserIntent(input: string): UserIntent {
    const intentPatterns: IntentPatterns = {
      direct_inquiry: {
        patterns: ['what', 'when', 'where', 'who', 'which'],
        subtypes: ['factual', 'temporal', 'procedural']
      },
      exploratory: {
        patterns: ['could', 'would', 'might', 'explore', 'possibilities'],
        subtypes: ['brainstorming', 'scenario_planning', 'ideation']
      },
      action_needed: {
        patterns: ['need to', 'should i', 'help me', 'how do i'],
        subtypes: ['immediate', 'planning', 'problem_solving']
      },
      reflection: {
        patterns: ['think about', 'reflect on', 'analyze', 'understand', 'realize', 'notice', 'observe'],
        subtypes: ['insight_generation', 'pattern_recognition', 'self_awareness', 'learning']
      },
      validation: {
        patterns: ['right', 'correct', 'makes sense', 'good idea'],
        subtypes: ['confirmation', 'reassurance', 'feedback']
      },
      creative: {
        patterns: ['create', 'design', 'imagine', 'innovative'],
        subtypes: ['content_creation', 'strategy', 'innovation']
      },
      strategic: {
        patterns: ['plan', 'strategy', 'long-term', 'growth'],
        subtypes: ['planning', 'optimization', 'scaling']
      },
      emotional_support: {
        patterns: ['feeling', 'stressed', 'worried', 'overwhelmed'],
        subtypes: ['encouragement', 'reassurance', 'guidance']
      },
      greeting: {
        patterns: ['hi', 'hello', 'hey', 'good morning', 'good afternoon'],
        subtypes: ['formal', 'informal', 'time_based']
        },
      email_search: {
        patterns: ['email', 'mail', 'message', 'find email', 'search email'],
        subtypes: ['search', 'filter', 'recent']
      }
    };

    let maxConfidence = 0;
    let detectedIntent: UserIntent['type'] = 'direct_inquiry';
    let detectedSubtype: string | undefined;

    for (const [intent, data] of Object.entries(intentPatterns)) {
      const matchedPatterns = data.patterns.filter(pattern => 
        input.toLowerCase().includes(pattern)
      );
      const confidence = matchedPatterns.length / data.patterns.length;
      
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        detectedIntent = intent as UserIntent['type'];
        detectedSubtype = data.subtypes[Math.floor(Math.random() * data.subtypes.length)];
      }
    }

    return {
      type: detectedIntent,
      confidence: maxConfidence,
      subtype: detectedSubtype
      };
    }

  private updateConversationState(input: string, previousMessages: Message[]) {
    const newEmotionalState = this.detectEmotionalState(input);
    const newIntent = this.detectUserIntent(input);
    const entities: ExtractedEntities = this.extractEntities(input);
    
    // Initialize mentionedEntities if undefined
    if (!this.conversationState.mentionedEntities) {
        this.conversationState.mentionedEntities = {
            names: new Set<string>(),
            dates: new Set<string>(),
            topics: new Set<string>()
        };
  }

    // Safely add new entities to tracking
    const mentionedEntities = this.conversationState.mentionedEntities;
    entities.names.forEach(name => mentionedEntities.names.add(name));
    entities.dates.forEach(date => mentionedEntities.dates.add(date));
    entities.topics.forEach(topic => mentionedEntities.topics.add(topic));
    
    // Track emotional shifts
    if (newEmotionalState.primary !== this.conversationState.emotionalState.primary) {
        this.conversationState.focusMetrics.emotionalShifts++;
    }
    
    // Track intent shifts
    if (newIntent.type !== this.conversationState.userIntent.type) {
        this.conversationState.focusMetrics.intentShifts++;
    }
    
    // Update conversation flow with enhanced context
    const contextQuality = this.calculateContextQuality();
    this.conversationState.conversationFlow.depthProgression.push(this.conversationState.topicDepth);
    this.conversationState.conversationFlow.engagementSignals.push(
        this.determineEngagementLevel(newIntent, contextQuality)
    );
    
    // Track topic changes with context
    const newTopic = this.extractCurrentTopic(this.convertMessagesToBaseMessages(previousMessages));
    if (newTopic !== this.conversationState.currentTopic) {
        this.conversationState.lastTopic = this.conversationState.currentTopic;
        this.conversationState.currentTopic = newTopic;
        this.conversationState.focusMetrics.topicChanges++;
        this.conversationState.conversationFlow.topicTransitions.push(newTopic);
        
        // Reset topic depth only if it's a completely new topic
        if (!this.isRelatedTopic(newTopic, this.conversationState.lastTopic)) {
            this.conversationState.topicDepth = 0;
        }
    }
    
    // Update context quality metrics
    if (this.detectExploration(input)) {
        this.conversationState.topicDepth++;
    }
    
    // Update state
    this.conversationState.emotionalState = newEmotionalState;
    this.conversationState.userIntent = newIntent;
    
    // Track query context
    if (!this.conversationState.queryContext) {
        this.conversationState.queryContext = [];
    }
    this.conversationState.queryContext.push({
        timestamp: Date.now(),
        intent: newIntent,
        entities: entities,
        topic: newTopic
    });
    
    // Maintain a sliding window of context (last 5 queries)
    if (this.conversationState.queryContext.length > 5) {
        this.conversationState.queryContext.shift();
    }
  }

  private determineEngagementLevel(intent: UserIntent, contextQuality: number): 'high' | 'medium' | 'low' {
    if (intent.confidence > 0.8 && contextQuality > 0.7) return 'high';
    if (intent.confidence > 0.5 && contextQuality > 0.4) return 'medium';
    return 'low';
  }

  private shouldAskForClarification(intent: UserIntent, contextQuality: number): boolean {
    return (
        intent.confidence < 0.6 ||
        contextQuality < 0.5 ||
        (intent.type === 'email_search' && !intent.sender && !intent.date)
    );
  }

  private isRelatedTopic(topic1: string, topic2: string): boolean {
    const relatedTopics: Record<string, string[]> = {
      'content strategy': ['market intelligence', 'audience development', 'social media'],
      'partnerships': ['growth', 'monetization', 'market intelligence'],
      'audience development': ['engagement', 'analytics', 'content strategy'],
      'analytics': ['market intelligence', 'content strategy', 'engagement'],
      'social media': ['engagement', 'content strategy', 'audience development'],
      'monetization': ['partnerships', 'growth', 'market intelligence']
    };

    return relatedTopics[topic1]?.includes(topic2) || relatedTopics[topic2]?.includes(topic1);
  }

  private async getEnhancedContext(input: string, context: ChatAgentContext): Promise<EnhancedContext> {
    // Get user's persona
    const userPersona = await this.rag.getUserPersona(context.userId);
    
    // Use persona to enhance search context
    const [contentContext, audienceContext, partnershipContext] = await Promise.all([
      this.rag.searchWithPersonaContext(input, context.userId, { type: 'insight', category: 'content' }),
      this.rag.searchWithPersonaContext(input, context.userId, { type: 'insight', category: 'audience' }),
      this.rag.searchWithPersonaContext(input, context.userId, { type: 'insight', category: 'partnership' })
    ]);

    // Calculate emotional resonance based on persona alignment
    const emotionalResonance = this.calculateEmotionalResonance(
      this.conversationState.emotionalState,
      userPersona
    );

    // Calculate intent alignment with persona goals
    const intentAlignment = this.calculateIntentAlignment(
      this.conversationState.userIntent,
      userPersona
    );

    // Determine user preferences based on persona and interaction history
    const userPreferences = this.determineUserPreferences(userPersona);

      return {
      content: contentContext,
      audience: audienceContext,
      partnerships: partnershipContext,
      conversationMetrics: {
        topicDepth: this.conversationState.topicDepth,
        contextQuality: this.calculateContextQuality(),
        focusScore: this.calculateFocusScore(),
        emotionalResonance,
        intentAlignment
      },
      userPreferences
      };
  }

  private calculateContextQuality(): number {
    const metrics = this.conversationState.focusMetrics;
    const topicChangePenalty = Math.min(metrics.topicChanges * 0.1, 0.5);
    const clarificationBonus = Math.min(metrics.clarificationRequests * 0.05, 0.3);
    const depthBonus = Math.min(metrics.contextDepth * 0.1, 0.4);
    
    return Math.max(0, Math.min(1, 1 - topicChangePenalty + clarificationBonus + depthBonus));
  }

  private calculateFocusScore(): number {
    const topicDepthWeight = Math.min(this.conversationState.topicDepth * 0.2, 1);
    const contextStackWeight = this.conversationState.contextStack.length * 0.1;
    const pendingActionsWeight = Math.max(0, 1 - this.conversationState.pendingActions.length * 0.2);
    
    // Calculate weighted average of focus metrics
    const focusScore = (
      topicDepthWeight * 0.4 +
      contextStackWeight * 0.3 +
      pendingActionsWeight * 0.3
    );
    
    return Math.max(0, Math.min(1, focusScore));
  }

  private updateResponseState(response: AIMessage) {
    const content = response.content.toString();
    
    // Detect response type
    if (content.toLowerCase().includes('clarify') || content.includes('?')) {
      this.conversationState.lastResponseType = 'clarification';
      this.conversationState.focusMetrics.clarificationRequests++;
    } else if (content.toLowerCase().includes('follow up') || content.toLowerCase().includes('next steps')) {
      this.conversationState.lastResponseType = 'followUp';
      this.conversationState.focusMetrics.followUpCount++;
    } else if (content.toLowerCase().includes('suggest') || content.toLowerCase().includes('recommend')) {
      this.conversationState.lastResponseType = 'suggestion';
    } else {
      this.conversationState.lastResponseType = 'answer';
    }
  }

  private calculateEmotionalResonance(
    emotionalState: EmotionalState,
    persona: { currentPersona: string; futureVision: string }
  ): number {
    // Calculate how well the emotional state aligns with persona goals
    const emotionalKeywords: Record<EmotionalState['primary'], string[]> = {
      neutral: ['balanced', 'steady', 'stable', 'calm'],
      excited: ['growth', 'opportunity', 'success', 'achievement'],
      frustrated: ['challenge', 'problem', 'difficulty', 'obstacle'],
      uncertain: ['question', 'unclear', 'unsure', 'possibility'],
      curious: ['learn', 'discover', 'explore', 'understand'],
      reflective: ['think', 'analyze', 'consider', 'evaluate'],
      stressed: ['pressure', 'deadline', 'overwhelm', 'busy'],
      optimistic: ['future', 'potential', 'progress', 'improvement']
    };

    const keywords = emotionalKeywords[emotionalState.primary] || [];
    const personaText = `${persona.currentPersona || ''} ${persona.futureVision || ''}`.toLowerCase();
    
    const matchCount = keywords.filter((word: string) => personaText.includes(word)).length;
    return matchCount / keywords.length;
  }

  private calculateIntentAlignment(
    intent: UserIntent,
    persona: { currentPersona: string; futureVision: string }
  ): number {
    const intentKeywords: IntentKeywords = {
        direct_inquiry: ['specific', 'exact', 'particular', 'precise'],
        exploratory: ['discover', 'explore', 'learn', 'understand'],
        action_needed: ['do', 'implement', 'start', 'change'],
        reflection: ['think', 'consider', 'analyze', 'evaluate'],
        validation: ['confirm', 'verify', 'check', 'ensure'],
        creative: ['create', 'design', 'develop', 'innovate'],
        strategic: ['plan', 'strategy', 'long-term', 'goal'],
        emotional_support: ['feel', 'cope', 'handle', 'manage'],
        greeting: ['hello', 'hi', 'hey', 'welcome', 'greet'],
        email_search: ['email', 'search', 'find', 'message']
    };

    const keywords = intentKeywords[intent.type];
    const personaText = `${persona.currentPersona} ${persona.futureVision}`.toLowerCase();
    
    const matchCount = keywords.filter(word => personaText.includes(word)).length;
    return matchCount / keywords.length;
  }

  private determineUserPreferences(
    persona: { currentPersona: string; futureVision: string }
  ): EnhancedContext['userPreferences'] {
    const personaText = `${persona.currentPersona} ${persona.futureVision}`.toLowerCase();
    
    // Determine communication style
    const communicationStyle = 
      personaText.includes('direct') || personaText.includes('specific') ? 'direct' :
      personaText.includes('explore') || personaText.includes('discover') ? 'exploratory' :
      'collaborative';

    // Determine detail level
    const detailLevel =
      personaText.includes('detail') || personaText.includes('thorough') ? 'high' :
      personaText.includes('brief') || personaText.includes('quick') ? 'low' :
      'medium';

    // Determine pace preference
    const pacePreference =
      personaText.includes('fast') || personaText.includes('quick') ? 'fast' :
      personaText.includes('thorough') || personaText.includes('detailed') ? 'thorough' :
      'moderate';

      return {
      communicationStyle,
      detailLevel,
      pacePreference
      };
  }

  protected convertMessagesToBaseMessages(messages: Message[]): BaseMessage[] {
    return messages.map(msg => {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      switch (msg.role) {
        case 'system':
          return new SystemMessage(content);
        case 'assistant':
          return new AIMessage(content);
        case 'user':
          return new HumanMessage(content);
        default:
          return new HumanMessage(content);
      }
    });
  }

  private shouldUseTools(intent: UserIntent): boolean {
    // Don't use tools for greetings and simple acknowledgments
    if (intent.type === 'greeting') return false;
    
    // Always use tools for email search and partnership queries
    if (intent.subtype === 'email_search' || intent.subtype === 'partnership') return true;
    
    // Use tools for specific inquiries and strategic questions that need data
    if (['direct_inquiry', 'strategic', 'action_needed'].includes(intent.type) && 
        intent.confidence > 0.7) return true;
    
    // Default to not using tools unless specifically needed
    return false;
  }

  private generateFollowUpSuggestions(): SuggestedAction[] {
    const suggestions: SuggestedAction[] = [];
    const state = this.conversationState;

    // Add exploration suggestions based on topic depth
    if (state.topicDepth < 3 && state.userIntent.type !== 'greeting') {
      suggestions.push({
        type: 'explore',
        description: `Would you like me to analyze ${state.currentTopic} in more detail?`,
        confidence: 0.8
      });
    }

    // Add clarification suggestions if context quality is low
    if (this.calculateContextQuality() < 0.7) {
      suggestions.push({
        type: 'clarify',
        description: 'Would you like me to explain any part of this in more detail?',
        confidence: 0.7
      });
    }

    // Add action suggestions based on pending actions
    if (state.pendingActions.length > 0) {
      suggestions.push({
        type: 'action',
        description: `Should we address ${state.pendingActions[0]} next?`,
        context: state.pendingActions[0],
        confidence: 0.9
      });
    }

    // Add strategic suggestions based on user intent
    if (state.userIntent.type === 'strategic' || state.userIntent.type === 'exploratory') {
      suggestions.push({
        type: 'strategic',
        description: 'Would you like to explore potential long-term implications or alternative approaches?',
        confidence: 0.85
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  private isEmailRelatedQuery(message: string): boolean {
    const emailKeywords = [
      'email', 'mail', 'gmail', 'inbox', 'message', 'sent',
      'received', 'from:', 'to:', 'subject:', 'label:',
      'partnership', 'contact', 'sender', 'recipient'
    ];
    
    return emailKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private formatEmailMemoryResponse(
    memoryResults: EmailMemorySearchResult,
    query: string
  ): string {
    const { nodes, confidence } = memoryResults;
    
    if (nodes.length === 0) {
      return "I don't have any relevant email information stored in memory.";
    }

    const summary = nodes.map((node: EmailMemoryNode) => `
      Subject: ${node.content.subject}
      From: ${node.content.participants[0]}
      Key Points: ${node.content.key_points.join(', ')}
      Topics: ${node.content.topics.join(', ')}
      Last Referenced: ${new Date(node.content.lastReferencedAt).toLocaleString()}
    `).join('\n\n');

    return `Based on my memory of your emails${confidence < 0.9 ? ' (though you might want to double-check)' : ''}, here's what I found:\n\n${summary}`;
  }

  private async checkConversationContext(
    input: string,
    context: ChatAgentContext
  ): Promise<{
    hasAnswer: boolean;
    answer?: string;
    entities?: {
      names: Set<string>;
      emails: Set<string>;
      dates: Set<string>;
      topics: Set<string>;
    };
  }> {
    // If no previous messages, return early
    if (!context.previousMessages || context.previousMessages.length === 0) {
      return { hasAnswer: false };
    }

    // Extract entities from previous messages
    const entities = {
      names: new Set<string>(),
      emails: new Set<string>(),
      dates: new Set<string>(),
      topics: new Set<string>()
    };

    // Process previous messages to extract information
    for (const message of context.previousMessages) {
      // Look for email-like patterns - enhanced to catch more variations
      const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
      const emails = message.content.match(emailPattern) || [];
      emails.forEach(email => entities.emails.add(email));

      // Enhanced name patterns to catch more variations
      const namePatterns = [
        /(?:From:|To:|Sender:|Recipient:)\s*([^<\n]+?)(?:\s*<|$)/gi,
        /(?:^|\n)([^<>\n]+?)\s*<[^>]+>/gi,
        /(?:name is|I am|I'm|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
      ];

      for (const pattern of namePatterns) {
        let match;
        while ((match = pattern.exec(message.content)) !== null) {
          const name = match[1].trim();
          if (name.length > 1) { // Avoid single-letter matches
            entities.names.add(name);
          }
        }
      }

      // Enhanced date patterns to catch more formats
      const datePatterns = [
        /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,                    // MM/DD/YYYY or DD/MM/YYYY
        /\b\d{4}-\d{2}-\d{2}\b/g,                          // YYYY-MM-DD
        /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi,  // Month DD, YYYY
        /\b\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b/gi,    // DD Month YYYY
        /\b(?:yesterday|today|tomorrow)\b/gi,               // Relative dates
        /\b(?:last|next|this) (?:week|month|year)\b/gi     // Relative periods
      ];

      for (const pattern of datePatterns) {
        const dates = message.content.match(pattern) || [];
        dates.forEach(date => entities.dates.add(date));
      }

      // Enhanced topic extraction
      const topicPatterns = [
        /Subject:\s*([^\n]+)/gi,
        /Topic:\s*([^\n]+)/gi,
        /Re:\s*([^\n]+)/gi,
        /Regarding:\s*([^\n]+)/gi,
        /(?:discussing|about|concerning)\s+([^,.!?]+)/gi
      ];

      for (const pattern of topicPatterns) {
        let match;
        while ((match = pattern.exec(message.content)) !== null) {
          const topic = match[1].trim();
          if (topic.length > 2) { // Avoid very short topics
            entities.topics.add(topic);
          }
        }
      }
    }

    // Enhanced question analysis
    const questionLower = input.toLowerCase();
    
    // Handle name-related questions with fuzzy matching
    if (questionLower.includes('name') || questionLower.includes('who') || 
        questionLower.match(/\b(?:called|named|known as)\b/)) {
      for (const name of entities.names) {
        const nameParts = name.toLowerCase().split(/\s+/);
        // Check for partial matches in name parts
        if (nameParts.some(part => 
            questionLower.includes(part) || 
            this.calculateLevenshteinDistance(part, questionLower) <= 2)) {
          return {
            hasAnswer: true,
            answer: this.formatAnswer('name', name, context),
            entities
          };
        }
      }
    }

    // Handle email-related questions with enhanced matching
    if (questionLower.includes('email') || questionLower.includes('address') || 
        questionLower.includes('contact') || questionLower.match(/\b(?:reach|message|send to)\b/)) {
      for (const email of entities.emails) {
        const [username] = email.split('@');
        if (questionLower.includes(username.toLowerCase()) || 
            this.calculateLevenshteinDistance(username.toLowerCase(), questionLower) <= 3) {
          return {
            hasAnswer: true,
            answer: this.formatAnswer('email', email, context),
            entities
          };
        }
      }
    }

    // Handle date-related questions with context
    if (questionLower.includes('when') || questionLower.includes('date') || 
        questionLower.match(/\b(?:time|scheduled|planned|happening)\b/)) {
      for (const date of entities.dates) {
        return {
          hasAnswer: true,
          answer: this.formatAnswer('date', date, context),
          entities
        };
      }
    }

    // Handle topic-related questions with fuzzy matching
    if (questionLower.includes('subject') || questionLower.includes('about') || 
        questionLower.match(/\b(?:topic|discussing|regarding|related to)\b/)) {
      for (const topic of entities.topics) {
        const topicWords = topic.toLowerCase().split(/\s+/);
        // Check for partial matches in topic words
        if (topicWords.some(word => 
            questionLower.includes(word) || 
            this.calculateLevenshteinDistance(word, questionLower) <= 2)) {
          return {
            hasAnswer: true,
            answer: this.formatAnswer('topic', topic, context),
            entities
          };
        }
      }
    }

    return {
      hasAnswer: false,
      entities
    };
  }

  private calculateLevenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }

    return matrix[b.length][a.length];
  }

  private formatAnswer(type: 'name' | 'email' | 'date' | 'topic', value: string, context: ChatAgentContext): string {
    const recentContext = context.previousMessages?.slice(-3) || [];
    const contextClues = recentContext
      .map(msg => msg.content)
      .join(' ')
      .toLowerCase();

    switch (type) {
      case 'name':
        return contextClues.includes('full name') 
          ? `The full name is ${value}.`
          : `The name is ${value}.`;
      
      case 'email':
        return contextClues.includes('contact') 
          ? `You can contact them at ${value}.`
          : `The email address is ${value}.`;
      
      case 'date':
        return contextClues.includes('exact') 
          ? `The exact date is ${value}.`
          : `This was on ${value}.`;
      
      case 'topic':
        return contextClues.includes('subject') 
          ? `The subject is "${value}".`
          : `This is regarding "${value}".`;
      
      default:
        return value;
    }
  }
}