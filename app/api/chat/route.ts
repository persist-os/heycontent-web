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
          input: `Process this insight request: ${message}
                 Context: ${insight.opportunity.title}
                 Additional Information: ${relevantDocs.map((doc: Document) => doc.pageContent).join('\n')}
                 User Query: ${context || message}`,
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
    const relevantContext = await rag.search(message)
    
    // If there's a referenced message, include it in the context
    let fullContext = message
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
      input: `Process this user message: ${fullContext}
             Additional Context: ${relevantContext.map((doc: Document) => doc.pageContent).join('\n')}`,
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
