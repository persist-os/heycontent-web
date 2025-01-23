import { ChatOpenAI } from "@langchain/openai";
import { Tool } from "@langchain/core/tools";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BaseTool } from "./tools/base-tool";
import { SocialMediaTool } from "./tools/social-media";
import { ContentAnalysisTool } from "./tools/content-analysis";
import { PartnershipTool } from "./tools/partnerships";
import { SmartNotesTool } from "./tools/smart-notes";
import { SocialMediaService } from "@/lib/services/social-media";
import { GmailService } from "@/lib/services/gmail";
import { RAGSystem } from "@/lib/rag";
import { prisma } from "@/lib/prisma";
import { EmailSearchTool } from "./tools/email-search";
import { EmailMessage } from "@/types/social-platforms";
import { ChatAgent } from './chat-agent';
import { EmailContextManager } from "./email-context-manager";

interface EmailContext {
  recentEmails: EmailMessage[];
  searchResults: EmailMessage[];
  timestamp: number;
}

interface ConversationState {
  currentTopic: string;
  lastTopic: string;
  topicDepth: number;
  contextStack: string[];
  pendingActions: string[];
  lastResponseType: 'answer' | 'question' | 'suggestion' | 'clarification';
  emotionalState: {
    primary: 'neutral' | 'excited' | 'confused' | 'frustrated' | 'curious' | 'reflective' | 'sad' | 'greeting' | 'confident' | 'uncertain';
    intensity: number;
    context: string;
  };
  userIntent: {
    type: 'direct_inquiry' | 'exploratory' | 'action_needed' | 'reflection' | 'greeting' | 'emotional' | 'strategic' | 'validation' | 'problem_solving' | 'unknown';
    confidence: number;
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
    engagementSignals: string[];
  };
}

interface AgentStep {
  tool: string;
  output: {
    results?: any[];
    [key: string]: any;
  };
}

export interface InitializationContext {
  userId?: string;
  platforms?: string[];
  features?: string[];
  previousMessages?: any[];
  ambientInsights?: any[];
}

interface ConversationCues {
  tone: 'excited' | 'confused' | 'frustrated' | 'neutral' | 'curious' | 'reflective' | 'sad' | 'greeting' | 'confident' | 'uncertain';
  intent: 'direct_inquiry' | 'exploratory' | 'action_needed' | 'reflection' | 'greeting' | 'emotional' | 'strategic' | 'validation' | 'problem_solving' | 'unknown';
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
    timeReference: 'past' | 'present' | 'future' | null;
    urgency: 'low' | 'medium' | 'high';
    decisionStage: 'awareness' | 'consideration' | 'decision' | null;
  };
}

const SYSTEM_PROMPT = `You are AVA IRIS, an AI assistant focused on helping creators optimize their social media presence and content strategy. You should always speak directly to the user in the first person, and refer to them in the second person (you/your).

Core Capabilities:
1. Email Management
   - Direct access to Gmail inbox
   - Search and analyze email content efficiently:
     * For specific emails (from person/date): Use direct search
     * For partnership analysis: Use partnership search
   - Track communication patterns
   - Provide actionable insights
   - Use email_search tool with precise queries

2. Content Strategy
   - Analyze your content performance
   - Suggest improvements for your content
   - Track your engagement patterns

3. Audience Insights
   - Analyze your audience behavior
   - Track your demographic trends
   - Identify your growth opportunities

4. Partnership Opportunities
   - Analyze your potential collaborations
   - Track your partnership performance
   - Optimize your outreach strategies

5. Smart Notes
   - Organize your insights
   - Track your progress
   - Maintain our conversation context

Remember:
- For email searches:
  * Be specific in your search queries
  * Use sender/date filters when available
  * Only use partnership analysis for partnership-related queries
- Speak directly to the user using "you" and "your"
- Provide value from any available content
- Focus on actionable insights
- Maintain natural conversation flow
- Be proactive in suggesting relevant insights
- Never refer to the user in the third person`;

export interface ProcessContext {
  previousMessages?: any[];
  userId?: string;
  platforms?: string[];
  features?: string[];
  metrics?: any;
  persona?: string | {
    currentPersona: string;
    futureVision: string;
    timestamp: string;
  };
  connectedPlatforms?: string[];
}

export interface InsightsContext {
  social: any;
  content: any[];
  audience: any[];
  partnerships: any[];
}

export class PlatformAgent {
  private model: ChatOpenAI;
  private executor: AgentExecutor | null = null;
  private rag: RAGSystem;
  private socialService: SocialMediaService;
  private gmailService?: GmailService;
  private chatAgent?: ChatAgent;
  private availableFeatures: Set<string> = new Set(['smartNotes']);
  private userId?: string;
  private conversationState: ConversationState = {
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
  private emailContext: EmailContext = {
    recentEmails: [],
    searchResults: [],
    timestamp: 0
  };
  private readonly EMAIL_CONTEXT_TTL = 5 * 60 * 1000; // 5 minutes
  private emailContextManager: EmailContextManager;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
      maxTokens: 2000,
    });
    this.rag = new RAGSystem();
    this.socialService = new SocialMediaService();
    this.emailContextManager = new EmailContextManager();

  }

  getExecutor() {
    return this.executor;
  }

  private async updateAvailableFeatures(platforms: string[], hasEmail: boolean) {
    this.availableFeatures.clear();
    this.availableFeatures.add('smartNotes'); // Always available

    if (platforms.length > 0) {
      this.availableFeatures.add('metrics');
      this.availableFeatures.add('audience');
      this.availableFeatures.add('content');
    }

    if (hasEmail) {
      this.availableFeatures.add('partnerships');
    }

    if (platforms.length > 0 || hasEmail) {
      this.availableFeatures.add('insights');
    }
  }

  private async initializeGmailService(userId: string) {
    try {
      const socialAccount = await prisma.socialAccount.findFirst({
        where: {
          userId,
          platform: 'gmail',
          isConnected: true
        }
      });

      if (socialAccount?.id) {
        this.gmailService = new GmailService(socialAccount.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing Gmail service:', error);
      return false;
    }
  }

  async initialize(context?: InitializationContext) {
    if (context?.userId) {
      this.userId = context.userId;
      
      // Get platform status
      const platformStatus = await this.socialService.getPlatformStatus();
      const connectedPlatforms = platformStatus
        .filter(p => p.isConnected)
        .map(p => p.platform);
      
      const hasEmail = platformStatus.find(p => p.platform === 'gmail')?.isConnected || false;

      // Update available features based on connections
      await this.updateAvailableFeatures(connectedPlatforms, hasEmail);

      // Initialize ChatAgent
      this.chatAgent = new ChatAgent(this.rag, context.userId, platformStatus);

      // Initialize Gmail service if connected
      if (hasEmail) {
        const gmailInitialized = await this.initializeGmailService(context.userId);
        if (gmailInitialized) {
          this.availableFeatures.add('email');
          
          // Pre-fetch recent emails for context
          if (this.gmailService) {
            try {
              const recentEmails = await this.gmailService.searchEmails('', 10);
              await Promise.all(recentEmails.map(async email => {
                if (this.gmailService && context.userId) {
                  await this.gmailService.storeEmailInRAG(email, context.userId);
                }
              }));
            } catch (error) {
              console.error('Error pre-fetching emails:', error);
            }
          }
        }
      }
    }

    // Initialize tools based on available features
    const tools: BaseTool[] = [
      ...(this.availableFeatures.has('email') && this.userId ? [new EmailSearchTool(this.userId, this.emailContextManager)] : []),
      new SocialMediaTool(this.socialService, this.rag),
      ...(this.availableFeatures.has('content') ? [new ContentAnalysisTool()] : []),
      ...(this.availableFeatures.has('partnerships') && this.gmailService ? [new PartnershipTool(this.rag)] : []),
      new SmartNotesTool(this.rag)
    ];

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPT],
      ["human", "{input}"],
      ["assistant", "{agent_scratchpad}"]
    ]);

    const agent = await createOpenAIFunctionsAgent({
      llm: this.model,
      tools: tools as Tool[],
      prompt,
    });

    this.executor = AgentExecutor.fromAgentAndTools({
      agent,
      tools: tools as Tool[],
      verbose: true,
      maxIterations: 3,
    });
  }

  private analyzeConversationCues(query: string): ConversationCues {
    // Implement conversation cue analysis
    const hasNegative = /dont|don't|not|no|never|can't|cant|won't|wont|stop|quit|give up|bad|worse|worst|hate|dislike|tired/i.test(query);
    const hasCuriosity = /what|how|why|tell me|curious|wonder|interested/i.test(query);
    const hasUrgency = /asap|urgent|quickly|soon|now|immediate|fast/i.test(query);
    
    return {
      tone: hasCuriosity ? 'curious' : hasNegative ? 'frustrated' : 'neutral',
      intent: query.includes('?') ? 'direct_inquiry' : hasCuriosity ? 'exploratory' : 'emotional',
      needsClarification: query.length < 15 || hasCuriosity,
      isQuestion: query.includes('?') || hasCuriosity,
      topicFocus: this.extractTopics(query),
      complexity: this.determineComplexity(query),
      emotionalState: {
        valence: hasNegative ? -0.5 : hasCuriosity ? 0.3 : 0,
        intensity: query.includes('!') ? 0.8 : 0.5,
        confidence: 0.8
      },
      contextualFactors: {
        timeReference: this.determineTimeReference(query),
        urgency: hasUrgency ? 'high' : query.length > 100 ? 'medium' : 'low',
        decisionStage: this.determineDecisionStage(query)
      }
    };
  }

  private extractTopics(query: string): string[] {
    const topics = query.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
      .split(' ')
      .filter(word => word.length > 3)
      .filter(word => !['what', 'when', 'where', 'which', 'how', 'why', 'tell', 'about'].includes(word));
    
    return [...new Set(topics)].slice(0, 3);
  }

  private determineComplexity(query: string): 'simple' | 'moderate' | 'complex' {
    const words = query.split(' ').length;
    const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1;
    const hasComplexStructures = /if|but|however|although|therefore|because/i.test(query);

    if (words > 30 || hasMultipleQuestions || hasComplexStructures) return 'complex';
    if (words > 15) return 'moderate';
    return 'simple';
  }

  private determineTimeReference(query: string): 'past' | 'present' | 'future' | null {
    if (/yesterday|last|ago|before|previous/i.test(query)) return 'past';
    if (/tomorrow|next|future|will|going to|plan/i.test(query)) return 'future';
    if (/now|today|current|currently/i.test(query)) return 'present';
    return null;
  }

  private determineDecisionStage(query: string): 'awareness' | 'consideration' | 'decision' | null {
    if (/what is|tell me about|explain|understand/i.test(query)) return 'awareness';
    if (/compare|which|better|difference|pros|cons/i.test(query)) return 'consideration';
    if (/should i|decide|choose|go with|select/i.test(query)) return 'decision';
    return null;
  }

  private enhanceQuery(
    query: string, 
    cues: ConversationCues,
    context: {
      socialMetrics?: any;
      contentPerformance?: any[];
      audienceInsights?: any[];
    }
  ): string {
    let enhancedQuery = query;

    // Add available features context
    enhancedQuery += `\n\nAvailable features: ${Array.from(this.availableFeatures).join(', ')}`;

    // Add platform context if available
    if (context.socialMetrics) {
      const platforms = Object.keys(context.socialMetrics);
      if (platforms.length > 0) {
        enhancedQuery += `\n\nConnected platforms: ${platforms.join(', ')}`;
      }
    }

    // Add conversation context based on cues
    if (cues.intent === 'direct_inquiry' && cues.needsClarification) {
      enhancedQuery += '\nNote: User might need clarification or more details.';
    }

    if (cues.contextualFactors.urgency === 'high') {
      enhancedQuery += '\nNote: User indicates urgency in their request.';
    }

    // Add relevant insights if available
    const hasContentInsights = Array.isArray(context.contentPerformance) && context.contentPerformance.length > 0;
    const hasAudienceInsights = Array.isArray(context.audienceInsights) && context.audienceInsights.length > 0;

    if (hasContentInsights || hasAudienceInsights) {
      enhancedQuery += '\n\nRelevant context:';
      if (hasContentInsights) {
        enhancedQuery += `\nContent insights: ${context.contentPerformance!.length} relevant items`;
      }
      if (hasAudienceInsights) {
        enhancedQuery += `\nAudience insights: ${context.audienceInsights!.length} relevant items`;
      }
    }

    return enhancedQuery;
  }

  private updateConversationState(
    query: string,
    cues: ConversationCues,
    response: any
  ) {
    // Update topic tracking
    if (this.conversationState.currentTopic !== cues.topicFocus[0]) {
      this.conversationState.lastTopic = this.conversationState.currentTopic;
      this.conversationState.currentTopic = cues.topicFocus[0];
      this.conversationState.focusMetrics.topicChanges++;
    }

    // Update emotional state
    const newEmotionalState = {
      primary: cues.tone,
      intensity: cues.emotionalState.intensity,
      context: query
    };
    if (newEmotionalState.primary !== this.conversationState.emotionalState.primary) {
      this.conversationState.focusMetrics.emotionalShifts++;
    }
    this.conversationState.emotionalState = newEmotionalState;

    // Update user intent
    const newIntent = {
      type: cues.intent,
      confidence: cues.emotionalState.confidence
    };
    if (newIntent.type !== this.conversationState.userIntent.type) {
      this.conversationState.focusMetrics.intentShifts++;
    }
    this.conversationState.userIntent = newIntent;

    // Update conversation flow metrics
    if (cues.needsClarification) {
      this.conversationState.focusMetrics.clarificationRequests++;
    }
    this.conversationState.focusMetrics.contextDepth = this.conversationState.contextStack.length;

    // Track conversation progression
    this.conversationState.conversationFlow.depthProgression.push(this.conversationState.focusMetrics.contextDepth);
    if (cues.complexity === 'complex') {
      this.conversationState.conversationFlow.engagementSignals.push('deep_engagement');
    }

    return this.conversationState;
  }

  private async updateEmailContext(searchResults: any[]) {
    const now = Date.now();
    // Clear old results if TTL expired
    if (now - this.emailContext.timestamp > this.EMAIL_CONTEXT_TTL) {
      this.emailContext = {
        recentEmails: [],
        searchResults: [],
        timestamp: now
      };
    }
    
    this.emailContext = {
      ...this.emailContext,
      searchResults: [...searchResults],
      timestamp: now
    };
  }

  public async process(query: string, context?: ProcessContext) {
    if (!this.executor || !this.userId) {
      await this.initialize(context);
    }

    if (!this.executor) {
      throw new Error("Agent executor not initialized");
    }

    if (!this.userId) {
      throw new Error("User ID is required for processing messages");
    }

    // Build email context from previous messages
    const emailContext = context?.previousMessages ? {
      referencedEmails: this.emailContextManager.getRelevantEmails(query),
      previousSearches: this.emailContextManager.getPreviousSearches()
    } : {
      referencedEmails: [],
      previousSearches: []
    };

     // Update conversation state with email context
     if (emailContext.referencedEmails.length > 0) {
      this.conversationState.contextStack.push('email_discussion');
      this.conversationState.focusMetrics.contextDepth++;
    }
    // Get relevant context from integrations
    const [socialMetrics, contentPerformance, audienceInsights, ...otherData] = await Promise.all([
      this.socialService?.getMetrics().catch(() => null),
      this.rag?.search(query, { type: 'insight', category: 'performance' }, 3).catch(() => []),
      this.rag?.search(query, { type: 'insight', category: 'audience' }, 2).catch(() => []),
      ...(this.gmailService && this.userId ? [
        this.gmailService?.getPartnershipEmails({ maxResults: 5 }).catch(() => [])
      ] : [])
    ]);

    const partnershipEmails = otherData[0] || [];

    // First, let ChatAgent process the query for enhanced conversation handling
    const platformStatus = await this.socialService.getPlatformStatus();
    const chatAgentResult = this.chatAgent ? await this.chatAgent.process(query, {
      userId: this.userId,
      previousMessages: context?.previousMessages,
      platformStatus
    }) : null;

    // Use ChatAgent's conversation analysis
    const conversationCues = chatAgentResult?.conversationState || this.analyzeConversationCues(query);
    const enhancedQuery = this.enhanceQuery(query, conversationCues, {
      socialMetrics,
      contentPerformance: contentPerformance || [],
      audienceInsights: audienceInsights || []
    });

    // Update conversation state
    this.updateConversationState(query, conversationCues, null);

    const enrichedContext = {
      ...context,
      conversationCues,
      previousMessages: context?.previousMessages || [],
      insights: {
        social: socialMetrics,
        content: contentPerformance || [],
        audience: audienceInsights || [],
        partnerships: partnershipEmails
      } as InsightsContext,
      availableFeatures: Array.from(this.availableFeatures),
      conversationState: chatAgentResult?.conversationState || this.conversationState,
      emailContext
    };

    const result = await this.executor!.call({ 
      input: enhancedQuery,
      context: enrichedContext
    });

    // Update email context if search was performed
    if (result.output && result.intermediateSteps?.some((step: AgentStep) => step.tool === 'email_search')) {
      const emailResults = result.intermediateSteps.find((step: AgentStep) => 
        step.tool === 'email_search')?.output?.results || [];
      const emailIds = this.extractEmailReferences(result.output);
      emailIds.forEach(id => this.emailContextManager.markEmailReferenced(id));
    }

    // Combine results from both agents
    return {
      ...result,
      conversationState: chatAgentResult?.conversationState || this.conversationState,
      suggestions: chatAgentResult?.suggestions || [],
      persona: chatAgentResult?.persona
    };
  }

  // Add new helper methods at the end
  private extractEmailReferences(content: string): string[] {
    const emailIdPattern = /email_id:([a-zA-Z0-9]+)/g;
    return Array.from(content.matchAll(emailIdPattern))
      .map(match => match[1]);
  }
} 