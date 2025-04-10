import { NextResponse } from 'next/server'
import { auth } from '../../../app/auth'
import { actionableInsights } from '@/src/data/insights'
import { AIActionableInsight } from '@/app/types/index'
import { PlatformAgent } from '@/app/lib/agent'
import { RAGSystem } from '@/app/lib/rag'
import { Message } from '@/app/types/chat'
import { Document } from "@langchain/core/documents";
import { InitializationContext } from '@/app/lib/agent';
import { SocialMediaService } from '@/app/lib/services/social-media';
import { InteractiveResponseHandler } from '@/app/lib/chat/interactive-response';

// Extract SearchResult interface from RAG system
interface SearchResult {
  id: string;
  content: string;
  metadata: any;
  similarity: number;
  pageContent?: string;
  reference_id?: string;
}

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

function formatEmailResult(doc: SearchResult) {
  const metadata = doc.metadata?.emailMetadata;
  if (!metadata || !doc.pageContent) return '';
  
  return `--- Email ---
Subject: ${metadata.subject}
From: ${metadata.from}
Date: ${metadata.date}
Summary: ${doc.pageContent.substring(0, 150)}...
-------------------`;
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
      const greetingResponse = {
        id: Date.now(),
        content: "Hello! How can I help you today?",
        role: 'assistant',
        timestamp: new Date().toISOString(),
        success: true
      };

      // Add interactive elements for greeting
      const interactiveResponse = InteractiveResponseHandler.generateInteractiveResponse(
        greetingResponse.content,
        { type: 'greeting' }
      );

      return NextResponse.json({
        ...greetingResponse,
        options: interactiveResponse.options,
        followUp: interactiveResponse.followUp,
        contextualSuggestions: interactiveResponse.contextualSuggestions
      });
    }

    // Initialize our systems first
    const rag = new RAGSystem()
    const agent = new PlatformAgent()
    const socialService = new SocialMediaService(rag)

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

    const ambientInsights = await rag.search('insight', recentTopics, {
      userId: session.user.id,
      limit: 1
    });

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
        const relevantDocs = await rag.search('insight', `${insight.opportunity.title} ${insight.opportunity.description}`, {
          userId: session.user.id
        });

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

        const cleanedContent = cleanMarkdownFormatting(result?.output || "I understand. How can I help you with that?");
        
        // Generate interactive response for insight-based query
        const interactiveResponse = InteractiveResponseHandler.generateInteractiveResponse(
          cleanedContent,
          { 
            insight,
            relevantDocs,
            availableFeatures
          }
        );

        return NextResponse.json({
          id: Date.now(),
          content: cleanedContent,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          success: true,
          ambientInsight: ambientInsights[0]?.pageContent,
          options: interactiveResponse.options,
          followUp: interactiveResponse.followUp,
          contextualSuggestions: interactiveResponse.contextualSuggestions
        });
      }
    }

    // For regular messages, first get relevant context from RAG
    const relevantContext = await rag.search('content', message, {
      userId: session.user.id
    });

    // Initialize fullContext with the message
    let fullContext = message;

    // More precise email query detection
    const emailQueryPattern = /\b(email|mail|message|from:|to:|subject:|sent by|received from)\b/i;
    const isEmailQuery = emailQueryPattern.test(message);

    // Extract potential email search terms
    const extractEmailTerms = (query: string, previousMessages: Message[]) => {
      const terms: {
        from?: string;
        subject?: string;
        date?: string;
      } = {};

      // Extract sender using various patterns
      const fromMatch = query.match(/\b(?:from:|from|by|sent by)\s+([^.,\n]+)/i);
      if (fromMatch) {
        terms.from = fromMatch[1].trim();
      }

      // Extract subject
      const subjectMatch = query.match(/\b(?:subject:|subject|about|regarding)\s+([^.,\n]+)/i);
      if (subjectMatch) {
        terms.subject = subjectMatch[1].trim();
      }

      // Extract date with support for various formats
      const dateMatch = query.match(/\b(?:date:|on|at|dated?|sent on)\s+([^.,\n]+)/i);
      if (dateMatch) {
        const rawDate = dateMatch[1].trim();
        // Try parsing full month names first
        const monthPattern = /(\d+)\s*(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)[a-z]*\s*(\d{4})?/i;
        const dateParts = rawDate.match(monthPattern);
        
        if (dateParts) {
          const day = dateParts[1];
          const month = dateParts[2];
          const year = dateParts[3] || new Date().getFullYear();
          
          // Map abbreviated months to full names
          const monthMap: { [key: string]: string } = {
            'jan': 'January', 'feb': 'February', 'mar': 'March',
            'apr': 'April', 'may': 'May', 'jun': 'June',
            'jul': 'July', 'aug': 'August', 'sep': 'September',
            'sept': 'September', 'oct': 'October', 'nov': 'November',
            'dec': 'December'
          };
          
          const fullMonth = monthMap[month.toLowerCase()] || month;
          const date = new Date(`${day} ${fullMonth} ${year}`);
          if (!isNaN(date.getTime())) {
            terms.date = date.toISOString().split('T')[0];
          }
        } else {
          // Try other date formats
          const date = new Date(rawDate);
          if (!isNaN(date.getTime())) {
            terms.date = date.toISOString().split('T')[0];
          }
        }
      }

      // Handle pronoun resolution
      const pronounPattern = /\b(he|she|they|him|her|their)\b/i;
      if (pronounPattern.test(query) && !terms.from && previousMessages.length > 0) {
        // Look for the most recent message that mentions a person's name or email
        for (let i = previousMessages.length - 1; i >= 0; i--) {
          const prevMessage = previousMessages[i];
          // Check email metadata first
          if (prevMessage.metadata?.emailMetadata?.from) {
            terms.from = prevMessage.metadata.emailMetadata.from;
            break;
          }
          // Look for name patterns in previous messages
          const nameMatch = prevMessage.content.match(/\b(?:from|by|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
          if (nameMatch) {
            terms.from = nameMatch[1];
            break;
          }
        }
      }

      // Handle sender name variations
      if (terms.from && !terms.from.includes('@') && !terms.from.includes(' ')) {
        // If it's just a first name, make it more flexible for search
        terms.from = `.*${terms.from}.*`; // Add regex wildcards for partial matching
      }

      return terms;
    };

    // Handle email queries with more precision
    if (isEmailQuery) {
      let emailContext = '';
      
      // Get email context if partnerships feature is available
      if (availableFeatures.includes('partnerships')) {
        const searchTerms = extractEmailTerms(message, previousMessages);
        
        // Declare emailResults with the correct type
        let emailResults: SearchResult[] = [];
        
        // Only proceed with search if we have resolved search terms
        if (searchTerms.from || searchTerms.subject || searchTerms.date) {
          // Build metadata filters
          const filters: Record<string, any> = {
            type: 'email'
          };

          if (searchTerms.from) {
            filters['emailMetadata.from'] = searchTerms.from;
          }
          if (searchTerms.subject) {
            filters['emailMetadata.subject'] = searchTerms.subject;
          }
          if (searchTerms.date) {
            filters['emailMetadata.date'] = searchTerms.date;
          }

          // Perform search with all filters at once
          emailResults = await rag.search('email', message, {
            userId: session.user.id,
            filters,
            limit: 5
          });
          
          // Format results
          if (emailResults.length > 0) {
            emailContext = '\n\nRelevant Emails:\n' + emailResults
              .map((doc, index) => {
                const metadata = doc.metadata?.emailMetadata;
                if (!metadata || !doc.pageContent) return '';
                
                return `\n--- Email ${index + 1} ---
Subject: ${metadata.subject}
From: ${metadata.from}
To: ${metadata.to.join(', ')}
Date: ${metadata.date}
Content: ${doc.pageContent.trim()}
-------------------`;
              })
              .filter(Boolean)
              .join('\n');
          } else {
            // Try a more lenient search by removing exact matches
            const lenientFilters = { ...filters };
            if (lenientFilters['emailMetadata.from']) {
              lenientFilters['emailMetadata.from'] = { $regex: lenientFilters['emailMetadata.from'].replace(/['"]/g, ''), $options: 'i' };
            }
            if (lenientFilters['emailMetadata.subject']) {
              lenientFilters['emailMetadata.subject'] = { $regex: lenientFilters['emailMetadata.subject'].replace(/['"]/g, ''), $options: 'i' };
            }

            emailResults = await rag.search('email', message, {
              userId: session.user.id,
              filters: lenientFilters,
              limit: 3
            });

            if (emailResults.length > 0) {
              emailContext = '\n\nNo exact matches found, but here are some related emails:\n' + emailResults
                .map(formatEmailResult)
                .filter(Boolean)
                .join('\n');
            }
          }
        } else {
          // Only ask for clarification if using ambiguous third-person pronouns
          const thirdPersonPronouns = /\b(he|she|they|him|her|their)\b/i;
          if (thirdPersonPronouns.test(message)) {
            fullContext = `I notice you're referring to someone with a pronoun. Could you please specify who you're looking for emails from?`;
            return NextResponse.json({
              id: Date.now(),
              content: fullContext,
              role: 'assistant',
              timestamp: new Date().toISOString(),
              success: true,
              metadata: {
                needsClarification: true,
                clarificationType: 'email_sender'
              }
            });
          }
          
          // Perform general email search with basic filters
          emailResults = await rag.search('email', message, {
            userId: session.user.id,
            filters: { type: 'email' },
            limit: 5
          });

          if (emailResults.length > 0) {
            emailContext = '\n\nRelevant emails:\n' + emailResults
              .map(formatEmailResult)
              .filter(Boolean)
              .join('\n');
          }
        }
      }
      
      fullContext = `${message}${emailContext}`;
    } else {
      // Handle non-email queries that might benefit from email context
      if (availableFeatures.includes('partnerships') && 
          /\b(partnership|collaboration|deal|agreement|contact|discuss|meeting)\b/i.test(message)) {
        const emailResults = await rag.search('email', message, {
          userId: session.user.id,
          filters: { type: 'email' },
          limit: 3
        });
        
        if (emailResults.length > 0) {
          fullContext += '\n\nRelevant email context:\n' + emailResults
            .map(formatEmailResult)
            .filter(Boolean)
            .join('\n');
        }
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

    // Check if this is a video-related query
    const videoQueryPattern = /\b(video|youtube|watch|views?|likes?|comments?|channel)\b/i;
    const isVideoQuery = videoQueryPattern.test(message);

    if (isVideoQuery) {
      // Use the new searchWithYouTube method that combines RAG and direct API results
      const videoResults = await rag.searchWithYouTube(message, session.user.id);
      
      if (videoResults.length > 0) {
        fullContext += '\n\nRelevant Videos:\n' + videoResults
          .map((result, index) => {
            try {
              // Handle both string and object content
              const videoData = typeof result.content === 'string' ? 
                JSON.parse(result.content) : result.content;
              
              // Extract metrics from either format
              const metrics = videoData.metrics || {};
              const date = videoData.date || videoData.publishedAt;
              
              return `\n--- Video ${index + 1} ---
Title: ${videoData.title || 'Untitled'}
Date: ${date ? new Date(date).toLocaleDateString() : 'N/A'}
Views: ${metrics.views || 'N/A'}
Likes: ${metrics.likes || 'N/A'}
Comments: ${metrics.comments || 'N/A'}
${videoData.analysis ? `Analysis: ${videoData.analysis}\n` : ''}-------------------`;
            } catch (e) {
              console.error('Error parsing video data:', e);
              // Fallback to raw content display
              return `\n--- Video ${index + 1} ---\n${
                typeof result.content === 'string' ? 
                result.content : JSON.stringify(result.content, null, 2)
              }\n-------------------`;
            }
          })
          .join('\n');
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
        ambientInsights: ambientInsights[0]?.pageContent,
        availableFeatures
      }
    });

    const cleanedContent = cleanMarkdownFormatting(result?.output || "I understand. How can I help you with that?");

    // Use the interactive response from the agent if available, or generate a new one
    const interactiveResponse = result.interactiveResponse || InteractiveResponseHandler.generateInteractiveResponse(
      cleanedContent,
      {
        availableFeatures,
        ambientInsights: ambientInsights[0]?.pageContent,
        suggestions: result.suggestions,
        context: fullContext
      }
    );

    return NextResponse.json({
      id: Date.now(),
      content: cleanedContent,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      success: true,
      metadata: {
        suggestions: result.suggestions,
        ambientInsight: ambientInsights[0]?.pageContent
      },
      options: interactiveResponse.options,
      followUp: interactiveResponse.followUp,
      contextualSuggestions: interactiveResponse.contextualSuggestions
    });

  } catch (error) {
    console.error('[CHAT_ERROR]', error)
    
    // Generate interactive response for error state
    const errorResponse = InteractiveResponseHandler.generateInteractiveResponse(
      'Internal Server Error',
      { error: true }
    );

    return NextResponse.json({ 
      error: 'Internal Server Error',
      success: false,
      options: errorResponse.options,
      followUp: errorResponse.followUp,
      contextualSuggestions: errorResponse.contextualSuggestions
    }, { status: 500 });
  }
} 
