import { NextResponse } from 'next/server'
import { auth } from '../../../app/auth'
import { actionableInsights } from '@/data/insights'
import { AIActionableInsight } from '@/types/index'
import { PlatformAgent } from '@/lib/agent'
import { RAGSystem } from '@/lib/rag'
import { Message } from '@/types/chat'
import { Document } from "@langchain/core/documents";
import { InitializationContext } from '@/lib/agent';
import { SocialMediaService } from '@/lib/services/social-media';

// Function to clean up markdown formatting
function cleanMarkdownFormatting(text: string): string {
  return text
    // Remove markdown headers
    .replace(/^###\s+/gm, '')
    .replace(/^##\s+/gm, '')
    .replace(/^#\s+/gm, '')
    // Remove bullet points
    .replace(/^\s*[-*]\s+/gm, '• ')
    // Remove numbered lists but keep numbers
    .replace(/^\s*\d+\.\s+/gm, (match) => match.trim() + ' ')
    // Clean up bold/italic markers
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/_/g, '')
    // Clean up extra newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface ChatRequest {
  message: string;
  insightId?: number;
  context?: string;
  referencedMessageId?: number;
  previousMessages?: Message[];
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        success: false 
      }, { status: 401 })
    }

    const body: ChatRequest = await req.json()
    const { message, insightId, context, referencedMessageId, previousMessages = [] } = body

    // Quick check for greetings to avoid unnecessary initialization
    const greetings = ['hi', 'hello', 'hey', 'greetings']
    if (greetings.includes(message.toLowerCase().trim())) {
      return NextResponse.json({
        id: Date.now(),
        content: "Hello! How can I help you today?",
        role: 'assistant',
        timestamp: new Date().toISOString(),
        success: true
      })
    }

    // Initialize our systems first
    const rag = new RAGSystem()
    const agent = new PlatformAgent()
    const socialService = new SocialMediaService()

    // Get platform status and available features
    const platformStatus = await socialService.getPlatformStatus()
    const connectedPlatforms = platformStatus
      .filter(p => p.isConnected)
      .map(p => p.platform)

    const availableFeatures = ['smartNotes']
    if (connectedPlatforms.length > 0) {
      availableFeatures.push('metrics', 'audience', 'content')
    }
    if (platformStatus.find(p => p.platform === 'gmail')?.isConnected) {
      availableFeatures.push('partnerships')
    }

    // Get ambient insights based on recent conversation
    const recentTopics = previousMessages
      .slice(-3)
      .map((msg: Message) => msg.content)
      .join(' ');

    const ambientInsights = await rag.search(recentTopics, {
      type: 'insight',
      userId: session.user.id
    }, 1);

    const initializationContext: InitializationContext = {
      userId: session.user.id,
      platforms: connectedPlatforms,
      features: availableFeatures,
      previousMessages: previousMessages,
      ambientInsights: ambientInsights.map(doc => doc.pageContent)
    };

    await agent.initialize(initializationContext)

    // If it's an insight-based query, handle it specially
    if (insightId) {
      const insight = actionableInsights.find((i: AIActionableInsight) => i.id === Number(insightId))
      if (insight) {
        const relevantDocs = await rag.search(
          `${insight.opportunity.title} ${insight.opportunity.description}`,
          { type: 'insight' }
        )

        const executor = agent.getExecutor();
        if (!executor) {
          throw new Error("Agent executor not initialized");
        }
        const result = await executor.call({
          input: `${insight.opportunity.title}\n${relevantDocs.map(doc => doc.pageContent || '').join('\n')}\nQuery: ${context || message}`,
          context: { 
            userId: session.user.id,
            previousMessages,
            ambientInsights: ambientInsights[0]?.pageContent
          }
        });

        return NextResponse.json({
          id: Date.now(),
          content: cleanMarkdownFormatting(result?.output || "I understand. How can I help you with that?"),
          role: 'assistant',
          timestamp: new Date().toISOString(),
          success: true,
          ambientInsight: ambientInsights[0]?.pageContent
        })
      }
    }

    // For regular messages, first get relevant context from RAG
    const relevantContext = await rag.search(message);

    // Initialize fullContext with the message
    let fullContext = message;

    // Handle email queries directly without additional context
    if (message.toLowerCase().includes('email') || message.toLowerCase().includes('from')) {
      fullContext = message; // Use only the original message for email queries
    } else {
      // Get email context if partnerships feature is available
      if (availableFeatures.includes('partnerships')) {
        const emailResults = await rag.search(message, {
          type: 'email',
          user_id: session.user.id
        });
        
        emailResults.forEach(doc => {
          const metadata = doc.metadata?.emailMetadata;
          if (!metadata || !doc.pageContent) return;
          
          fullContext += `\nEmail: ${metadata.subject}
From: ${metadata.from}
To: ${metadata.to.join(', ')}
Date: ${metadata.date}
Content: ${doc.pageContent}`;
        });
      }

      // Get context strings from relevant documents
      const relevantStrings: string[] = relevantContext
        .map(doc => doc.pageContent)
        .filter((content): content is string => typeof content === 'string');

      // Add relevant context
      if (relevantStrings.length > 0) {
        fullContext += `\n\nContext: ${relevantStrings.join('\n')}`;
      }
    }

    // If there's a referenced message, include it in the context
    if (referencedMessageId) {
      const referencedMessage = previousMessages.find((msg: Message) => msg.id === referencedMessageId);
      if (referencedMessage) {
        fullContext = `Referenced message: "${referencedMessage.content}"\nCurrent message: ${message}`;
      }
    }

    // Let the agent process the message with the relevant context
    const executor = agent.getExecutor();
    if (!executor) {
      throw new Error("Agent executor not initialized");
    }

    const result = await executor.call({
      input: fullContext,
      context: { 
        userId: session.user.id,
        previousMessages,
        ambientInsights: ambientInsights[0]?.pageContent
      }
    });

    return NextResponse.json({
      id: Date.now(),
      content: cleanMarkdownFormatting(result?.output || "I understand. How can I help you with that?"),
      role: 'assistant',
      timestamp: new Date().toISOString(),
      success: true,
      ambientInsight: ambientInsights[0]?.pageContent
    })

  } catch (error) {
    console.error('[CHAT_ERROR]', error)
    return NextResponse.json({ 
      error: 'Internal Server Error',
      success: false 
    }, { status: 500 })
  }
} 
