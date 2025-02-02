import { ChatOpenAI } from "@langchain/openai";
import { Tool } from "@langchain/core/tools";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BaseTool } from "./tools/base-tool";
import { SocialMediaTool } from "./tools/social-media";
import { ContentAnalysisTool } from "./tools/content-analysis";
import { PartnershipTool } from "./tools/partnerships";
import { SmartNotesTool } from "./tools/smart-notes";
import { SocialMediaService } from "@/app/lib/services/social-media";
import { GmailService } from "@/app/lib/services/gmail";
import { RAGSystem } from "@/app/lib/rag";
import prisma from "@/app/lib/prisma";
import { EmailSearchTool } from "./tools/email-search";
import { EmailMessage } from "@/app/types/social-platforms";
import { SmartChatAgent } from '../chat-agent/smart-chat-agent';
import { EmailContextManager } from '@/app/lib/agent/email-context-manager';
import { PlatformStatus, ProcessResult } from '../chat-agent/types';
import { AdvancedMemorySystem } from "../memory/advanced-memory-system";
import { SmartProcessingPipeline } from "../smart-processing-pipeline";
import { MemoryAwareChatSystem } from "../memory-aware-chat-system";

interface EmailContext {
  recentEmails: EmailMessage[];
  searchResults: EmailMessage[];
  referencedEmails: string[];
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

export const SYSTEM_PROMPT = `You are an AI assistant focused on helping users manage their digital presence and content across multiple platforms. 
Your role is to provide insights, suggestions, and help users optimize their content strategy.
Be professional, clear, and always aim to provide actionable insights.`;

export class PlatformAgent {
  private model: ChatOpenAI;
  private executor: AgentExecutor | null = null;
  private rag: RAGSystem;
  private socialService: SocialMediaService;
  private gmailService?: GmailService;
  private chatAgent?: SmartChatAgent;
  private availableFeatures: Set<string> = new Set(['smartNotes']);
  private userId?: string;
  private smartPipeline?: SmartProcessingPipeline;
  private memoryAwareChat?: MemoryAwareChatSystem;
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
    referencedEmails: [],
    timestamp: 0
  };
  private readonly EMAIL_CONTEXT_TTL = 5 * 60 * 1000; // 5 minutes
  private emailContextManager: EmailContextManager;
  private memorySystem: AdvancedMemorySystem;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
      maxTokens: 2000,
    });
    this.rag = new RAGSystem();
    this.socialService = new SocialMediaService();
    this.emailContextManager = new EmailContextManager('');
    this.memorySystem = new AdvancedMemorySystem(this.rag);
    this.memoryAwareChat = new MemoryAwareChatSystem(this.rag);
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

      if (socialAccount?.userId) {
        this.gmailService = new GmailService(socialAccount.userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing Gmail service:', error);
      return false;
    }
  }

  private async searchEmails(query: string): Promise<EmailMessage[]> {
    if (!this.gmailService) {
      return [];
    }
    const searchResults = await this.gmailService.searchEmails(query, 10);
    return searchResults;
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

      // Initialize SmartChatAgent with platform status
      this.chatAgent = new SmartChatAgent(
        this.rag,
        context.userId,
        platformStatus
      );

      // Initialize SmartProcessingPipeline
      this.smartPipeline = new SmartProcessingPipeline(
        {
          userId: context.userId,
          platformStatus,
          emailMemoryManager: this.emailContextManager,
          memorySystem: this.memorySystem
        },
        this.memorySystem
      );

      // Update EmailContextManager with actual userId
      this.emailContextManager = new EmailContextManager(context.userId);

      // Initialize Gmail service if connected
      if (hasEmail) {
        const gmailInitialized = await this.initializeGmailService(context.userId);
        if (gmailInitialized) {
          this.availableFeatures.add('email');
          
          // Pre-fetch recent emails for context
          if (this.gmailService) {
            try {
              const recentEmails = await this.gmailService.searchEmails('', 10);
              if (recentEmails) {
                await Promise.all(recentEmails.map(async email => {
                  if (this.gmailService && context.userId) {
                    await this.gmailService.storeEmailInRAG(email, context.userId);
                  }
                }));
              }
            } catch (error) {
              console.error('Error pre-fetching emails:', error);
            }
          }
        }
      }
    }

    // Initialize tools based on available features
    const tools: BaseTool[] = [
      ...(this.availableFeatures.has('email') && this.userId ? [
        new EmailSearchTool(
          this.userId, 
          this.emailContextManager,
          this.memorySystem
        )
      ] : []),
      new SocialMediaTool(this.socialService, this.rag),
      ...(this.availableFeatures.has('content') ? [new ContentAnalysisTool()] : []),
      ...(this.availableFeatures.has('partnerships') && this.gmailService ? [new PartnershipTool(this.rag)] : []),
      new SmartNotesTool(this.rag)
    ];

    // Keep the OpenAI Functions agent as fallback
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
        referencedEmails: [],
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

    try {
      // First try processing with SmartProcessingPipeline
      if (this.smartPipeline && this.chatAgent) {
        const pipelineResult = await this.smartPipeline.process(query);
        
        if (pipelineResult.confidence > 0.7) {
          // Use smart pipeline result if confidence is high
          const chatResult = await this.chatAgent.process(query);
          return {
            output: pipelineResult.response,
            conversationState: chatResult.conversationState,
            suggestions: chatResult.suggestions || [],
            persona: chatResult.persona,
            metadata: pipelineResult.metadata
          };
        }
      }

      // Fallback to OpenAI Functions agent if smart pipeline isn't available or has low confidence
      // ... rest of existing process() method ...
      const emailContext = this.emailContextManager ? await (async () => {
        const [relevantEmails, previousSearches] = await Promise.all([
          this.emailContextManager.getRelevantEmails(query),
          this.emailContextManager.getPreviousSearches()
        ]);
        return {
          referencedEmails: relevantEmails,
          previousSearches
        };
      })() : {
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
        this.rag?.search('performance', query).catch(() => []),
        this.rag?.search('audience', query).catch(() => []),
        ...(this.gmailService && this.userId ? [
          this.gmailService?.getPartnershipEmails({ maxResults: 5 }).catch(() => [])
        ] : [])
      ]);

      const partnershipEmails = otherData[0] || [];

      // First, let ChatAgent process the query for enhanced conversation handling
      const platformStatus = await this.socialService.getPlatformStatus();
      const chatAgentResult = this.chatAgent ? await this.chatAgent.process(query) : null;

      // Use ChatAgent's conversation analysis
      const chatAgentState = chatAgentResult?.conversationState;
      const conversationCues = chatAgentState ? this.transformToConversationCues(chatAgentState) : this.analyzeConversationCues(query);
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

    } catch (error) {
      console.error('Error in process:', error);
      throw error;
    }
  }

  // Add new helper methods at the end
  private extractEmailReferences(content: string): string[] {
    const emailIdPattern = /email_id:([a-zA-Z0-9]+)/g;
    return Array.from(content.matchAll(emailIdPattern))
      .map(match => match[1]);
  }

  async processMessage(message: string): Promise<ProcessResult> {
    try {
      if (!this.chatAgent) {
        throw new Error('Chat agent not initialized');
      }
      
      const result = await this.chatAgent.process(message);
      
      // Helper function to ensure timeReference is of the correct type
      const validateTimeReference = (ref: string | null): 'past' | 'present' | 'future' | null => {
        if (ref === 'past' || ref === 'present' || ref === 'future') {
          return ref;
        }
        return null;
      };

      // Helper function to ensure decisionStage is of the correct type
      const validateDecisionStage = (stage: string | null): 'awareness' | 'consideration' | 'decision' | null => {
        if (stage === 'awareness' || stage === 'consideration' || stage === 'decision') {
          return stage;
        }
        return null;
      };
      
      return {
        output: result.output,
        error: result.error,
        conversationState: {
          currentIntent: result.conversationState.currentIntent,
          mood: result.conversationState.mood || 'neutral',
          contextualMemory: result.conversationState.contextualMemory,
          tone: (result.conversationState.tone || 'neutral') as 'excited' | 'confused' | 'frustrated' | 'neutral' | 'curious' | 'reflective' | 'sad' | 'greeting' | 'confident' | 'uncertain',
          intent: (result.conversationState.intent || 'direct_inquiry') as 'direct_inquiry' | 'exploratory' | 'action_needed' | 'reflection' | 'greeting' | 'emotional' | 'strategic' | 'validation' | 'problem_solving' | 'unknown',
          needsClarification: result.conversationState.needsClarification || false,
          isQuestion: result.conversationState.isQuestion || false,
          topicFocus: result.conversationState.topicFocus || [],
          complexity: (result.conversationState.complexity || 'moderate') as 'simple' | 'moderate' | 'complex',
          emotionalState: result.conversationState.emotionalState || {
            valence: 0,
            intensity: 0.5,
            confidence: 1.0
          },
          contextualFactors: result.conversationState.contextualFactors ? {
            timeReference: validateTimeReference(result.conversationState.contextualFactors.timeReference),
            urgency: (result.conversationState.contextualFactors.urgency || 'medium') as 'low' | 'medium' | 'high',
            decisionStage: validateDecisionStage(result.conversationState.contextualFactors.decisionStage)
          } : {
            timeReference: null,
            urgency: 'medium' as const,
            decisionStage: null
          }
        },
        suggestions: result.suggestions,
        persona: result.persona
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async handleError(error: Error | unknown): Promise<ProcessResult> {
    const errorState = {
      currentIntent: 'error',
      mood: 'neutral',
      contextualMemory: [],
      tone: 'neutral' as const,
      intent: 'problem_solving' as const,
      needsClarification: true,
      isQuestion: false,
      topicFocus: ['error_handling'],
      complexity: 'simple' as const,
      emotionalState: {
        valence: 0,
        intensity: 0.5,
        confidence: 1.0
      },
      contextualFactors: {
        timeReference: 'present' as 'past' | 'present' | 'future' | null,
        urgency: 'high' as const,
        decisionStage: 'awareness' as 'awareness' | 'consideration' | 'decision' | null
      }
    };

    return {
      output: 'An error occurred: ' + (error instanceof Error ? error.message : String(error)),
      error: error instanceof Error ? error : new Error(String(error)),
      conversationState: errorState,
      suggestions: ['Try again later', 'Check system status'],
      persona: {
        tone: 'professional',
        style: 'helpful'
      }
    };
  }

  private async handleEmailSearch(query: string): Promise<ProcessResult> {
    try {
      const searchResults = await this.searchEmails(query);
      
      if (!searchResults || searchResults.length === 0) {
        return {
          output: 'No emails found matching your search.',
          conversationState: {
            currentIntent: 'email_search',
            mood: 'neutral',
            contextualMemory: [],
            tone: 'neutral' as const,
            intent: 'direct_inquiry' as const,
            needsClarification: true,
            isQuestion: false,
            topicFocus: ['email_search'],
            complexity: 'simple' as const,
            emotionalState: {
              valence: 0,
              intensity: 0.3,
              confidence: 1.0
            },
            contextualFactors: {
              timeReference: 'present' as const,
              urgency: 'medium' as const,
              decisionStage: 'consideration' as const
            }
          },
          suggestions: ['Try a different search term', 'View recent emails'],
          persona: {
            tone: 'professional',
            style: 'helpful'
          }
        };
      }

      // Process search results with chat agent
      if (this.chatAgent) {
        const result = await this.chatAgent.process(
          `Found ${searchResults.length} emails matching your search. Here are the results: ${JSON.stringify(searchResults)}`
        );

        // Validate timeReference and decisionStage
        const validateTimeRef = (ref: any): 'past' | 'present' | 'future' | null => {
          if (ref === 'past' || ref === 'present' || ref === 'future') {
            return ref;
          }
          return null;
        };

        const validateDecisionStage = (stage: any): 'awareness' | 'consideration' | 'decision' | null => {
          if (stage === 'awareness' || stage === 'consideration' || stage === 'decision') {
            return stage;
          }
          return null;
        };

        return {
          ...result,
          conversationState: {
            ...result.conversationState,
            contextualFactors: {
              timeReference: validateTimeRef(result.conversationState.contextualFactors?.timeReference),
              urgency: (result.conversationState.contextualFactors?.urgency || 'medium') as 'low' | 'medium' | 'high',
              decisionStage: validateDecisionStage(result.conversationState.contextualFactors?.decisionStage)
            }
          }
        };
      }

      return this.handleError(new Error('Chat agent not initialized'));
    } catch (error) {
      return this.handleError(error);
    }
  }

  private transformToConversationCues(state: { 
    currentIntent: string; 
    emotionalState?: string | { valence: number; intensity: number; confidence: number; }; 
    contextualMemory: any[];
    mood?: string;
    tone?: string;
  }): ConversationCues {
    // Extract emotional state from either format
    const emotionalTone = typeof state.emotionalState === 'string' 
      ? state.emotionalState 
      : state.mood || state.tone || 'neutral';

    return {
      tone: emotionalTone as 'excited' | 'confused' | 'frustrated' | 'neutral' | 'curious' | 'reflective' | 'sad' | 'greeting' | 'confident' | 'uncertain',
      intent: state.currentIntent as 'direct_inquiry' | 'exploratory' | 'action_needed' | 'reflection' | 'greeting' | 'emotional' | 'strategic' | 'validation' | 'problem_solving' | 'unknown',
      needsClarification: false,
      isQuestion: false,
      topicFocus: state.contextualMemory.map(m => m.topic || '').filter(Boolean),
      complexity: 'moderate' as const,
      emotionalState: {
        valence: typeof state.emotionalState === 'object' ? state.emotionalState.valence : 0,
        intensity: typeof state.emotionalState === 'object' ? state.emotionalState.intensity : 0.5,
        confidence: typeof state.emotionalState === 'object' ? state.emotionalState.confidence : 0.5
      },
      contextualFactors: {
        timeReference: 'present' as 'past' | 'present' | 'future' | null,
        urgency: 'medium' as const,
        decisionStage: 'consideration' as 'awareness' | 'consideration' | 'decision' | null
      }
    };
  }
} 