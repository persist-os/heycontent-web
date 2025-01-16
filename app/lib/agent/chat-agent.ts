import { BaseAgent } from "./base-agent";
import { Message } from "@/types/conversation";
import { RAGSystem, AVADocumentType, AVAMetadata } from "../rag";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAI } from "@langchain/openai";
import { BaseMessageLike } from "@langchain/core/messages";
import { selectModel } from "../openai";
import { EmailSearchTool } from "./tools/email-search";
import { SocialPlatform, EmailMessage, PartnershipEmail } from "../../types/social-platforms";

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

interface ChatAgentContext {
  userId: string;
  previousMessages?: Message[];
  lastResponse?: string;
  emailSearchResults?: (EmailMessage | PartnershipEmail)[];
}

interface EmotionalState {
  primary: 'neutral' | 'excited' | 'frustrated' | 'uncertain' | 'curious' | 'reflective' | 'stressed' | 'optimistic';
  intensity: number; // 0-1
  context: string;
}

interface UserIntent {
  type: 'direct_inquiry' | 'exploratory' | 'action_needed' | 'reflection' | 'validation' | 'creative' | 'strategic' | 'emotional_support' | 'greeting';
  confidence: number; // 0-1
  subtype?: string;
}

interface IntentKeywords {
  [key: string]: string[];
  direct_inquiry: string[];
  exploratory: string[];
  action_needed: string[];
  reflection: string[];
  validation: string[];
  creative: string[];
  strategic: string[];
  emotional_support: string[];
  greeting: string[];
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
    communicationStyle: 'direct' | 'collaborative' | 'exploratory';
    detailLevel: 'high' | 'medium' | 'low';
    pacePreference: 'fast' | 'moderate' | 'thorough';
  };
  emails?: {
    recent: any[];
    relevant: any[];
  };
}

interface EmailContext {
  recentEmails: (EmailMessage | PartnershipEmail)[];
  searchResults: (EmailMessage | PartnershipEmail)[];
  timestamp: number;
  searchQuery?: string;
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
  private readonly EMAIL_CONTEXT_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(rag: RAGSystem, userId: string, platformStatus: PlatformStatus[]) {
    super(rag, 'chat');
    this.userId = userId;
    this.platformStatus = platformStatus;
    this.context = { userId };
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
    // Check for email search intent first
    const emailTerms = this.extractEmailSearchTerms(message);
    if (emailTerms) {
        return {
        type: 'email_search',
        query: emailTerms.query,
        sender: emailTerms.sender,
        date: emailTerms.date
        };
    }

    // Basic greeting detection - match at start of message
    if (/^(hi|hello|hey|good\s*(morning|afternoon|evening))\b/i.test(message.trim())) {
        return {
            type: 'greeting',
            confidence: 0.9
        };
    }

    // Question detection
    if (/^(what|how|why|when|where|who|can|could|would|should|is|are|do|does|did|will|has|have)\b/i.test(message)) {
        return {
            type: 'direct_inquiry',
            confidence: 0.8
        };
    }

    // Partnership-related query detection
    if (/\b(partner|partnership|collaboration|deal|agreement)\b/i.test(message)) {
        return {
            type: 'strategic',
            confidence: 0.8,
            subtype: 'partnership'
        };
    }

    // Default to exploratory for longer messages
    return {
        type: message.length > 50 ? 'exploratory' : 'direct_inquiry',
        confidence: 0.6
    };
  }

  private extractEmailSearchTerms(message: string): EmailSearchTerms | null {
    const lowercaseMsg = message.toLowerCase();
    
    // Common email search patterns
    const emailPatterns = [
      /(?:find|show|get|search)?\s*(?:emails?|messages?)\s*(?:from|by|sent by)?\s*([a-zA-Z\s]+)/i,
      /(?:what did|when did)\s*([a-zA-Z\s]+)\s*(?:say|write|send)/i,
      /(?:find|show|get)\s*([a-zA-Z\s]+)'s?\s*(?:emails?|messages?)/i
    ];

    // Try to match sender from email content
    let sender: string | undefined;
    
    // First check if we have an actual email signature in the content
    const signatureMatch = message.match(/(?:Best regards|Sincerely|Regards),?\s*\n?\s*([^\n]+)/i);
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
              sender = match[1].trim();
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

    // Return null if no clear email intent
    if (!sender && !this.hasEmailSearchIndicators(lowercaseMsg)) {
      return null;
    }

    // Always return an object with the search terms
    return {
      sender,
      date,
      query: message // Keep original query for context
    };
  }

  private hasEmailSearchIndicators(message: string): boolean {
    const indicators = [
      'email', 'emails', 'message', 'messages',
      'inbox', 'gmail', 'mail', 'sent',
      'from:', 'to:', 'subject:', 'after:', 'before:'
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

      const emailSearchTool = new EmailSearchTool(this.userId);
      const searchResponse = await emailSearchTool._call({
        query: intent.query,
        sender: intent.sender,
        date: intent.date,
        maxResults: 10,
        includeThreads: true
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
        searchQuery: intent.query
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

  async process(input: string, context: ChatAgentContext): Promise<{
    output: string;
    context?: any;
    conversationState?: any;
    error?: Error;
    persona?: any;
  }> {
    try {
      // First analyze the message intent
      const messageIntent = await this.analyzeMessageIntent(input);
      
      // For greetings, respond immediately without any additional processing
      if (messageIntent.type === 'greeting') {
        return {
          output: "Hello! How can I help you today?",
          conversationState: {
            ...this.conversationState,
            userIntent: messageIntent,
            lastResponseType: 'answer'
          }
        };
      }

      // For email queries, handle them directly
      if (messageIntent.type === 'email_search') {
        const searchTerms = this.extractEmailSearchTerms(input);
        if (!searchTerms) {
          return {
            output: "I couldn't understand your email search query. Could you please rephrase it?",
            conversationState: {
              ...this.conversationState,
              userIntent: messageIntent,
              lastResponseType: 'clarification'
            }
          };
        }

        await this.updateEmailContext({
          type: 'email_search',
          query: searchTerms.query,
          sender: searchTerms.sender,
          date: searchTerms.date
        });

        const results = this.context.emailSearchResults || [];
        
        if (results.length === 0) {
          const suggestion = searchTerms.sender ? 
            `I searched for emails from "${searchTerms.sender}" but couldn't find any. Would you like to try a different name or search term?` :
            `I couldn't find any emails matching your query. Could you provide more specific details like the sender's name?`;
            
          return {
            output: suggestion,
            context: {
              searchTerms,
              lastSearchTime: Date.now()
            },
            conversationState: {
              ...this.conversationState,
              userIntent: messageIntent,
              lastResponseType: 'answer'
            }
          };
        }

        // Format the results in a user-friendly way
        const formattedResults = results.map((email: (EmailMessage | PartnershipEmail)) => ({
          subject: email.subject,
          from: email.from,
          date: new Date(email.date).toLocaleString(),
          preview: email.body?.substring(0, 150) + '...'
        }));

        const searchDescription = searchTerms.sender ? 
          `emails from ${searchTerms.sender}` :
          'matching emails';

        return {
          output: `Here are the ${searchDescription} I found:\n\n${formattedResults.map((email) => 
            `From: ${email.from}\nSubject: ${email.subject}\nDate: ${email.date}\n${email.preview}\n---`
          ).join('\n\n')}`,
          context: {
            emails: results,
            searchTerms,
            lastSearchTime: Date.now()
          },
          conversationState: {
            ...this.conversationState,
            userIntent: messageIntent,
            lastResponseType: 'answer',
            currentTopic: 'email_search',
            topicDepth: this.conversationState.topicDepth + 1
          }
        };
      }

      // For other queries, proceed with normal processing
      this.updateConversationState(input, context.previousMessages || []);
      const userPersona = await this.rag.getUserPersona(context.userId);
      const enhancedContext = await this.getEnhancedContext(input, context);
      
      // Build messages array with emotional and intent awareness
      const messages: BaseMessage[] = [];
      messages.push(new SystemMessage(
        `${this.systemPrompt}\n\nCurrent User State:\n` +
        `Current Persona: ${userPersona?.currentPersona || ''}\n` +
        `Future Vision: ${userPersona?.futureVision || ''}\n` +
        `Emotional State: ${this.conversationState.emotionalState.primary} (${this.conversationState.emotionalState.intensity})\n` +
        `Intent: ${this.conversationState.userIntent.type} (${this.conversationState.userIntent.confidence})\n` +
        `Context: ${this.conversationState.emotionalState.context}`
      ));
      
      if (context.previousMessages && context.previousMessages.length > 0) {
        messages.push(...this.convertMessagesToBaseMessages(context.previousMessages));
      }
      
      messages.push(new HumanMessage(input));
      const response = await this.model.invoke(messages);
      
      return {
        output: response.content as string,
        context: enhancedContext,
        conversationState: this.conversationState,
        persona: userPersona
      };

    } catch (err: unknown) {
      console.error('Error in ChatAgent process:', err);
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      
      if (error.message?.includes('Gmail authorization required')) {
      return {
          output: "I need access to your Gmail account to search your emails. Please connect your Gmail account in the settings.",
          error
        };
      }
      return {
        output: "I encountered an error processing your request. Could you please try again?",
        error
      };
    }
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
    const intentPatterns = {
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
        patterns: ['think about', 'consider', 'wonder if', 'feels like'],
        subtypes: ['analysis', 'evaluation', 'introspection']
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
    
    // Track emotional shifts
    if (newEmotionalState.primary !== this.conversationState.emotionalState.primary) {
      this.conversationState.focusMetrics.emotionalShifts++;
    }
    
    // Track intent shifts
    if (newIntent.type !== this.conversationState.userIntent.type) {
      this.conversationState.focusMetrics.intentShifts++;
    }
    
    // Update conversation flow
    this.conversationState.conversationFlow.depthProgression.push(this.conversationState.topicDepth);
    this.conversationState.conversationFlow.engagementSignals.push(
      newIntent.confidence > 0.7 ? 'high' : newIntent.confidence > 0.4 ? 'medium' : 'low'
    );
    
    // Update state
    this.conversationState.emotionalState = newEmotionalState;
    this.conversationState.userIntent = newIntent;
    
    // Existing topic and context updates...
    const newTopic = this.extractCurrentTopic(this.convertMessagesToBaseMessages(previousMessages));
    if (newTopic !== this.conversationState.currentTopic) {
      this.conversationState.lastTopic = this.conversationState.currentTopic;
      this.conversationState.currentTopic = newTopic;
      this.conversationState.focusMetrics.topicChanges++;
      this.conversationState.conversationFlow.topicTransitions.push(newTopic);
    }
    
    // Update context quality metrics
    if (this.detectExploration(input)) {
      this.conversationState.topicDepth++;
    }
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
    
    return Math.max(0, Math.min(1, (topicDepthWeight + contextStackWeight + pendingActionsWeight) / 3));
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
    // Calculate how well the user's intent aligns with their persona goals
    const intentKeywords = {
      direct_inquiry: ['specific', 'exact', 'particular', 'precise'],
      exploratory: ['discover', 'explore', 'learn', 'understand'],
      action_needed: ['do', 'implement', 'start', 'change'],
      reflection: ['think', 'consider', 'analyze', 'evaluate'],
      validation: ['confirm', 'verify', 'check', 'ensure'],
      creative: ['create', 'design', 'develop', 'innovate'],
      strategic: ['plan', 'strategy', 'long-term', 'goal'],
      emotional_support: ['feel', 'cope', 'handle', 'manage'],
      greeting: ['hello', 'hi', 'hey', 'welcome', 'greet']
    };

    const keywords = intentKeywords[intent.type] || [];
    const personaText = `${persona.currentPersona} ${persona.futureVision}`.toLowerCase();
    
    const matchCount = keywords.filter((word: string) => personaText.includes(word)).length;
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
} 