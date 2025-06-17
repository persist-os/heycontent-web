import { useState, useCallback, useRef } from 'react'
import { Message } from '@/app/types/chat'
import { sendChatMessage } from '../utils/api-utils'
import { ChatStateReturnType } from './useChatState'
import { getHelpMessage } from '../data/help-message'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { ConvexHttpClient } from 'convex/browser'

import { v4 as uuidv4 } from 'uuid';
import type { ThinkingStep } from '@/app/types/chat';

interface MentionData {
  id: string;
  type: 'platform' | 'content';
  subtype: string;
  title: string;
}

interface InteractiveOption {
  text: string;
  action?: string;
}

interface ContentContext {
  platform: string;
  contentId: string;
  title?: string;
  analysis?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  metrics?: any;
  content?: string;
}

export const useChat = (
  chatState: ChatStateReturnType,
  userId?: string
) => {
  const {
    sessionId,
    setSessionId,
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    error,
    setError,
    isFirstMessage,
    setIsFirstMessage,
    contentContext,
    includeAnalysisInQuery,
  } = chatState
  const [referencedMessage, setReferencedMessage] = useState<Message | null>(null)
  const [currentMentions, setCurrentMentions] = useState<MentionData[]>([])
  
  // Add ref to track last sent message to prevent rapid duplicates
  const lastSentMessageRef = useRef<{ content: string; timestamp: number } | null>(null);

  // Add mutation hooks for chat mutations
  const createConversationMutation = useMutation(api.chatMutations.createConversation);
  const addMessageToConversationMutation = useMutation(api.chatMutations.addMessageToConversation);

  // Helper function to fetch file data for mentions
  const fetchMentionData = useCallback(async (mention: MentionData) => {
    if (!userId) return null;
    
    try {
      // Create a Convex client to make direct queries
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      
      const fileData = await convex.query(api.usersFilesQueries.getFileData, {
        userId,
        fileId: mention.id
      });
      
      return fileData;
    } catch (error) {
      console.warn('Error fetching mention data:', error);
      return null;
    }
  }, [userId]);

  const handleSendMessage = useCallback((content: string, mentions?: MentionData[]) => {
    // Wrap the async logic to return void immediately
    (async () => {
      // USE MULTIPLE DEBUG METHODS TO ENSURE VISIBILITY
      console.log('🚨🚨🚨 HANDLE SEND MESSAGE CALLED 🚨🚨🚨', { content, mentions, userId });
      console.log('🚨🚨🚨 HANDLE SEND MESSAGE CALLED 🚨🚨🚨', { content, mentions, userId });
      console.log('🚨🚨🚨 HANDLE SEND MESSAGE CALLED 🚨🚨🚨', { content, mentions, userId });
      const trimmedContent = content.trim();
      
      if (!trimmedContent) {
        console.log('🔍 Empty content, returning early');
        return;
      }
      
      console.log('🔥 Processing message:', { trimmedContent, userId, mentions });

      // Check if this is the first message based on current state
      const effectiveSessionId = sessionId; // Don't mutate state here
      const firstMessage = messages.length === 0; // True first message
      const isPersistentFirstMessage = !effectiveSessionId; // First message for persistence

      console.log('🔍 Message context:', {
        messageCount: messages.length,
        firstMessage,
        isPersistentFirstMessage,
        sessionId: effectiveSessionId,
        referencedMessage: !!referencedMessage
      });

      // Store mentions for context resolution
      if (mentions && mentions.length > 0) {
        setCurrentMentions(mentions);
      }

      // Determine if this is the first message by checking sessionId directly
      const isFirstMessage = !sessionId;
      const backendSessionId = isFirstMessage ? null : sessionId;

      // Initialize thinking steps
      const thinkingSteps: ThinkingStep[] = [];
      let currentStepIndex = 0;

      const addThinkingStep = (step: Omit<ThinkingStep, 'id' | 'startTime'>) => {
        const newStep: ThinkingStep = {
          ...step,
          id: `step-${currentStepIndex++}`,
          startTime: Date.now(),
        };
        thinkingSteps.push(newStep);
        return newStep;
      };

      const updateThinkingStep = (stepId: string, updates: Partial<ThinkingStep>) => {
        const step = thinkingSteps.find(s => s.id === stepId);
        if (step) {
          Object.assign(step, updates);
          if (updates.status === 'completed' && !step.endTime) {
            step.endTime = Date.now();
            step.duration = step.endTime - (step.startTime || 0);
          }
        }
      };

      // Inject AI analysis into the query if enabled and available
      let enhancedQuery = content;
      
      // 🧠 INTELLIGENT CONTEXT SEARCH - Automatically find relevant user content
      console.log('🧠 Debug - Checking intelligent context conditions:', {
        hasUserId: !!userId,
        userId: userId,
        hasMentions: !!mentions?.length,
        mentionsLength: mentions?.length,
        contentLength: content.length,
        willRunSearch: !!(userId && !mentions?.length && content.length > 10)
      });
      
      console.log('🧠 Detailed condition check:', {
        'userId exists': !!userId,
        'userId value': userId,
        'mentions is falsy': !mentions?.length,
        'mentions value': mentions,
        'content length > 10': content.length > 10,
        'content length': content.length,
        'all conditions met': !!(userId && !mentions?.length && content.length > 10)
      });
      
      if (userId && !mentions?.length && content.length > 10) {
        console.log('🧠 ALL CONDITIONS MET - Starting intelligent context search');
        
        // Add thinking step for intelligent context search
        const contextSearchStep = addThinkingStep({
          title: 'Intelligent Context Search',
          description: 'Searching your data for relevant context to enhance the response',
          status: 'processing',
          details: ['Analyzing query for relevant keywords', 'Searching across your connected platforms']
        });

        try {
          console.log('🧠 Running intelligent context search for query:', content);
          
          const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
          const intelligentContext = await convex.query(api.intelligentContextQueries.getIntelligentContextData, {
            userId,
            query: content,
            limit: 3, // Keep it focused - top 3 most relevant items
            excludeTypes: [], // Don't exclude any types for now
          });

          if (intelligentContext && intelligentContext.length > 0) {
            console.log(`🧠 Found ${intelligentContext.length} relevant context items:`, 
              intelligentContext.map(item => ({ 
                title: item.fileReference.title, 
                type: item.fileReference.subtype, 
                score: item.relevanceScore 
              }))
            );

            // Update thinking step with success
            updateThinkingStep(contextSearchStep.id, {
              status: 'completed',
              details: [
                `Found ${intelligentContext.length} relevant items`,
                ...intelligentContext.map(item => 
                  `• ${item.fileReference.title} (${item.fileReference.subtype}) - Score: ${item.relevanceScore.toFixed(1)}`
                )
              ],
              data: intelligentContext.map(item => ({
                title: item.fileReference.title,
                type: item.fileReference.subtype,
                score: item.relevanceScore
              }))
            });

            const contextStrings = [];
            
            for (const contextItem of intelligentContext) {
              const { fileReference, content: actualData } = contextItem;
              
              if (actualData) {
                if (fileReference.subtype === 'email' || fileReference.subtype === 'email_thread') {
                  let emailContext = `📧 Email Reference - ${fileReference.title}:\n`;
                  emailContext += `From: ${actualData.from || fileReference.from || 'Unknown'}\n`;
                  emailContext += `Subject: ${actualData.subject || 'No subject'}\n`;
                  emailContext += `Content: ${actualData.body || actualData.snippet || fileReference.snippet || 'No content available'}\n`;
                  contextStrings.push(emailContext);
                  
                } else if (fileReference.subtype === 'video') {
                  let videoContext = `🎥 YouTube Video - ${fileReference.title}:\n`;
                  if (actualData.snippet) {
                    videoContext += `Title: ${actualData.snippet.title || fileReference.title}\n`;
                    videoContext += `Description: ${actualData.snippet.description || 'No description'}\n`;
                    if (actualData.statistics) {
                      videoContext += `Views: ${actualData.statistics.views || 'Unknown'}\n`;
                      videoContext += `Likes: ${actualData.statistics.likes || 'Unknown'}\n`;
                    }
                    if (actualData.snippet.tags && actualData.snippet.tags.length > 0) {
                      videoContext += `Tags: ${actualData.snippet.tags.slice(0, 5).join(', ')}\n`;
                    }
                  } else {
                    videoContext += `Summary: ${fileReference.snippet || 'No summary available'}\n`;
                  }
                  contextStrings.push(videoContext);
                  
                } else if (fileReference.subtype === 'note') {
                  let noteContext = `📝 Note - ${fileReference.title}:\n`;
                  noteContext += `Content: ${actualData.content || actualData.body || fileReference.snippet || 'No content available'}\n`;
                  if (actualData.tags && actualData.tags.length > 0) {
                    noteContext += `Tags: ${actualData.tags.join(', ')}\n`;
                  }
                  contextStrings.push(noteContext);
                  
                } else if (fileReference.subtype === 'insight') {
                  let insightContext = `💡 AI Insight - ${fileReference.title}:\n`;
                  
                  // Handle Ambient Insights (data array)
                  if (actualData.data && Array.isArray(actualData.data)) {
                    actualData.data.forEach((insight, index) => {
                      if (index < 3) { // Show first 3 insights
                        insightContext += `• ${insight.title}: ${insight.content}\n`;
                        if (insight.recommendation) {
                          insightContext += `  Recommendation: ${insight.recommendation}\n`;
                        }
                      }
                    });
                  }
                  // Handle YouTube AI Insights (analysis.insights array)
                  else if (actualData.analysis && actualData.analysis.insights && Array.isArray(actualData.analysis.insights)) {
                    actualData.analysis.insights.forEach((insight, index) => {
                      if (index < 3) { // Show first 3 insights
                        insightContext += `• ${insight.title}\n`;
                        if (insight.whyNow && insight.whyNow.length > 0) {
                          insightContext += `  Why Now: ${insight.whyNow[0]}\n`;
                        }
                        if (insight.actionSteps && insight.actionSteps.length > 0) {
                          insightContext += `  Action: ${insight.actionSteps[0]}\n`;
                        }
                        if (insight.expectedOutcome) {
                          insightContext += `  Expected Outcome: ${insight.expectedOutcome}\n`;
                        }
                      }
                    });
                  }
                  // Handle Instagram Batch Analysis Insights
                  else if (actualData.insights && actualData.insights.insights && Array.isArray(actualData.insights.insights)) {
                    actualData.insights.insights.forEach((insight, index) => {
                      if (index < 3) { // Show first 3 insights
                        insightContext += `• ${insight.title}\n`;
                        if (insight.whyNow && insight.whyNow.length > 0) {
                          insightContext += `  Why Now: ${insight.whyNow[0]}\n`;
                        }
                        if (insight.actionSteps && insight.actionSteps.length > 0) {
                          insightContext += `  Action: ${insight.actionSteps[0]}\n`;
                        }
                        if (insight.expectedOutcome) {
                          insightContext += `  Expected Outcome: ${insight.expectedOutcome}\n`;
                        }
                      }
                    });
                  }
                  // Fallback to snippet
                  else {
                    insightContext += `Summary: ${fileReference.snippet || 'No insights available'}\n`;
                  }
                  contextStrings.push(insightContext);
                  
                } else if (fileReference.subtype === 'persona' || fileReference.platform === 'personas') {
                  let personaContext = `🎭 Persona - ${fileReference.title}:\n`;
                  if (actualData.current_name) {
                    personaContext += `Current: ${actualData.current_name}\n`;
                    personaContext += `Description: ${actualData.current_description || 'No description'}\n`;
                  }
                  if (actualData.future_name) {
                    personaContext += `Future Goal: ${actualData.future_name}\n`;
                    personaContext += `Vision: ${actualData.future_description || 'No vision'}\n`;
                  }
                  if (actualData.content_pillars && actualData.content_pillars.length > 0) {
                    personaContext += `Content Pillars: ${actualData.content_pillars.join(', ')}\n`;
                  }
                  if (actualData.unique_value) {
                    personaContext += `Unique Value: ${actualData.unique_value}\n`;
                  }
                  contextStrings.push(personaContext);
                  
                } else if (fileReference.subtype === 'conversation' || fileReference.platform === 'conversations') {
                  let conversationContext = `💬 Conversation - ${fileReference.title}:\n`;
                  if (actualData.messages && actualData.messages.length > 0) {
                    conversationContext += `Messages: ${actualData.messages.length}\n`;
                    // Show last 2 messages for context
                    const recentMessages = actualData.messages.slice(-2);
                    recentMessages.forEach(msg => {
                      const preview = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
                      conversationContext += `${msg.role}: ${preview}\n`;
                    });
                  } else {
                    conversationContext += `Summary: ${fileReference.snippet || 'No conversation content'}\n`;
                  }
                  contextStrings.push(conversationContext);
                  
                } else if (fileReference.subtype === 'analytics' || fileReference.platform === 'analytics') {
                  let analyticsContext = `📊 Analytics - ${fileReference.title}:\n`;
                  if (actualData) {
                    // Handle Instagram Tracker Analysis
                    if (actualData.analysis) {
                      // The data is nested under analysis.content
                      const data = actualData.analysis.content || actualData.analysis;
                      if (data.last_post) {
                        analyticsContext += `Last Post: ${data.last_post.time_ago || 'Unknown'} (${data.last_post.type || 'Unknown type'})\n`;
                      }
                      if (data.posting_frequency) {
                        analyticsContext += `Posting Frequency: ${data.posting_frequency.average_days_between_posts || 'N/A'} days between posts\n`;
                        analyticsContext += `Recent Posts: ${data.posting_frequency.has_recent_posts ? 'Yes' : 'No'}\n`;
                        analyticsContext += `Posts Last 7 Days: ${data.posting_frequency.total_posts_last_7_days || '0'}\n`;
                      }
                      if (data.media_distribution) {
                        analyticsContext += `Media Distribution:\n`;
                        Object.entries(data.media_distribution).forEach(([type, percentage]) => {
                          if (percentage && percentage !== '0%') {
                            analyticsContext += `  • ${type}: ${percentage}\n`;
                          }
                        });
                      }
                    }
                    // Handle Instagram Batch Analysis
                    else if (actualData.insights) {
                      analyticsContext += `Batch Insights: AI-generated content analysis insights\n`;
                      if (typeof actualData.insights === 'object') {
                        analyticsContext += `Analysis Type: ${actualData.analysisType || 'batch'}\n`;
                      }
                    }
                    // Fallback to snippet
                    else {
                      analyticsContext += `Summary: ${fileReference.snippet || 'No analytics data available'}\n`;
                    }
                  } else {
                    analyticsContext += `Summary: ${fileReference.snippet || 'No analytics data available'}\n`;
                  }
                  contextStrings.push(analyticsContext);
                  
                } else {
                  // Generic content handling
                  let genericContext = `📄 ${fileReference.subtype} - ${fileReference.title}:\n`;
                  genericContext += `Platform: ${fileReference.platform}\n`;
                  if (actualData.content) genericContext += `Content: ${actualData.content}\n`;
                  else if (actualData.description) genericContext += `Description: ${actualData.description}\n`;
                  else if (fileReference.snippet) genericContext += `Summary: ${fileReference.snippet}\n`;
                  contextStrings.push(genericContext);
                }
              }
            }

            if (contextStrings.length > 0) {
              enhancedQuery = `Relevant Context from User's Files:\n${contextStrings.join('\n\n')}\n\n---\n\nUser Question: ${content}\n\nPlease answer the user's question using the relevant context above when helpful. If the context isn't relevant to their question, you can ignore it.`;
              console.log('🧠 Enhanced query with intelligent context:', enhancedQuery.substring(0, 200) + '...');
            }
          } else {
            console.log('🧠 No relevant context found for query');
            // Update thinking step with no results
            updateThinkingStep(contextSearchStep.id, {
              status: 'completed',
              details: ['No relevant context found for this query']
            });
          }
        } catch (error) {
          console.warn('🧠 Failed to fetch intelligent context:', error);
          // Update thinking step with error
          updateThinkingStep(contextSearchStep.id, {
            status: 'error',
            details: ['Failed to search context: ' + (error instanceof Error ? error.message : 'Unknown error')]
          });
        }
      }
      
      // Add mention context if available (this runs in addition to intelligent context)
      if (mentions && userId) {
        // Add thinking step for mention processing
        const mentionStep = addThinkingStep({
          title: 'Processing References',
          description: `Processing ${mentions.length} referenced items`,
          status: 'processing',
          details: mentions.map(m => `• ${m.title} (${m.subtype})`)
        });

        try {
          const mentionContexts = [];
          
          // Fetch data for each mention based on type and subtype
          for (const mention of mentions) {
            const fileData = await fetchMentionData(mention);
            
            if (fileData) {
              const { fileReference, actualData } = fileData;
              
            if (mention.type === 'content') {
                // Handle content mentions (email, video, notes, etc.)
                if (mention.subtype === 'email' || mention.subtype === 'email_thread') {
                  let emailContent = `Email Reference - ${mention.title}:\n`;
                  
                  if (actualData) {
                    emailContent += `Subject: ${actualData.subject || 'No subject'}\n`;
                    emailContent += `From: ${actualData.from || fileReference.from || 'Unknown'}\n`;
                    emailContent += `Date: ${actualData.date || fileReference.date || 'Unknown'}\n`;
                    emailContent += `Content: ${actualData.body || actualData.snippet || fileReference.snippet || 'No content available'}\n`;
                  } else {
                    emailContent += `Summary: ${fileReference.snippet || 'No summary available'}\n`;
                  }
                  
                  mentionContexts.push(emailContent);
                  
                } else if (mention.subtype === 'video') {
                  let videoContent = `Video Reference - ${mention.title}:\n`;
                  
                  if (actualData) {
                    videoContent += `Title: ${actualData.title || mention.title}\n`;
                    videoContent += `Description: ${actualData.description || 'No description'}\n`;
                    videoContent += `Views: ${actualData.viewCount || 'Unknown'}\n`;
                    videoContent += `Duration: ${actualData.duration || 'Unknown'}\n`;
                    if (actualData.tags && actualData.tags.length > 0) {
                      videoContent += `Tags: ${actualData.tags.join(', ')}\n`;
                    }
                  } else {
                    videoContent += `Summary: ${fileReference.snippet || 'No summary available'}\n`;
                    if (fileReference.stats) {
                      videoContent += `Views: ${fileReference.stats.views || 'Unknown'}\n`;
                      videoContent += `Likes: ${fileReference.stats.likes || 'Unknown'}\n`;
                    }
                  }
                  
                  mentionContexts.push(videoContent);
                  
                } else if (mention.subtype === 'note') {
                  let noteContent = `Note Reference - ${mention.title}:\n`;
                  
                  if (actualData) {
                    noteContent += `Title: ${actualData.title || mention.title}\n`;
                    noteContent += `Content: ${actualData.content || actualData.body || 'No content available'}\n`;
                    if (actualData.tags && actualData.tags.length > 0) {
                      noteContent += `Tags: ${actualData.tags.join(', ')}\n`;
                    }
                  } else {
                    noteContent += `Summary: ${fileReference.snippet || 'No summary available'}\n`;
                  }
                  
                  mentionContexts.push(noteContent);
                  
                } else {
                  // Generic content handling
                  let contentData = `Content Reference - ${mention.title}:\n`;
                  contentData += `Type: ${mention.subtype}\n`;
                  contentData += `Summary: ${fileReference.snippet || 'No summary available'}\n`;
                  
                  if (actualData) {
                    if (actualData.title) contentData += `Title: ${actualData.title}\n`;
                    if (actualData.content) contentData += `Content: ${actualData.content}\n`;
                    if (actualData.description) contentData += `Description: ${actualData.description}\n`;
                  }
                  
                  mentionContexts.push(contentData);
                }
                
            } else if (mention.type === 'platform') {
              // Handle platform mentions
                let platformContent = `Platform Reference - ${mention.title}:\n`;
                platformContent += `Platform: ${mention.subtype}\n`;
                
                if (actualData) {
                  if (mention.subtype === 'platform_gmail' || fileReference.platform === 'gmail') {
                    platformContent += `Subject: ${actualData.subject || 'No subject'}\n`;
                    platformContent += `From: ${actualData.from || 'Unknown'}\n`;
                    platformContent += `Content: ${actualData.body || actualData.snippet || 'No content'}\n`;
                  } else if (mention.subtype === 'platform_youtube' || fileReference.platform === 'youtube') {
                    platformContent += `Title: ${actualData.title || mention.title}\n`;
                    platformContent += `Description: ${actualData.description || 'No description'}\n`;
                    if (actualData.viewCount) platformContent += `Views: ${actualData.viewCount}\n`;
                  } else if (mention.subtype === 'platform_instagram' || fileReference.platform === 'instagram') {
                    platformContent += `Caption: ${actualData.caption || 'No caption'}\n`;
                    if (actualData.likesCount) platformContent += `Likes: ${actualData.likesCount}\n`;
                  }
                } else {
                  platformContent += `Summary: ${fileReference.snippet || 'No summary available'}\n`;
                  if (fileReference.stats) {
                    if (fileReference.stats.views) platformContent += `Views: ${fileReference.stats.views}\n`;
                    if (fileReference.stats.likes) platformContent += `Likes: ${fileReference.stats.likes}\n`;
                  }
                }
                
                mentionContexts.push(platformContent);
              }
            } else {
              // Fallback if we can't fetch the data
              mentionContexts.push(`Reference - ${mention.title}: [Content not available]`);
            }
          }
          
          if (mentionContexts.length > 0) {
            enhancedQuery = `Referenced Content:\n${mentionContexts.join('\n\n')}\n\n---\n\nUser Question: ${content}`;
            
            // Update thinking step with success
            updateThinkingStep(mentionStep.id, {
              status: 'completed',
              details: [
                `Successfully processed ${mentionContexts.length} references`,
                ...mentions.map(m => `• ${m.title} - Added to context`)
              ]
            });
          } else {
            updateThinkingStep(mentionStep.id, {
              status: 'completed',
              details: ['No mention context could be extracted']
            });
          }
        } catch (error) {
          console.warn('Failed to process mentions:', error);
          updateThinkingStep(mentionStep.id, {
            status: 'error',
            details: ['Failed to process references: ' + (error instanceof Error ? error.message : 'Unknown error')]
          });
        }
      }
      
      if (includeAnalysisInQuery && contentContext?.analysis) {
        enhancedQuery = `Context for user question:\n\n${contentContext.analysis}\n\n Make sure to address user question in your response\n\n---\n\n${enhancedQuery}`;
      }

      const newMessage: Message = {
        id: uuidv4() as string,
        content, // Store the original user message for display
        role: 'user',
        timestamp: new Date().toISOString(),
        referencedMessage: referencedMessage ? {
          id: referencedMessage.id,
          content: referencedMessage.content
        } : undefined,
        chat_response: content,
        sessionId: sessionId, // Include current sessionId
        metadata: mentions ? { mentions } : undefined // Store mentions in metadata
      }

      try {
        setIsLoading(true)
        setError(null)

        // Add AI processing thinking step
        const aiProcessingStep = addThinkingStep({
          title: 'AI Processing',
          description: 'Generating response using context and user query',
          status: 'processing',
          details: ['Sending request to AI backend', 'Processing enhanced query with context']
        });

        // Add user message and typing indicator with thinking steps
        setMessages(prev => [
          ...prev,
          newMessage,
          {
            id: uuidv4(),
            content: '...',
            role: 'assistant',
            timestamp: new Date().toISOString(),
            status: 'typing',
            chat_response: '',
            metadata: {
              thinking_steps: thinkingSteps
            }
          }
        ]);

        // Save persona conversations separately
        if (sessionId && sessionId.startsWith('persona_')) {
          if (isFirstMessage) {
            const conversationId = await createConversationMutation({
              userId: userId || '',
              title: 'Persona Conversation',
              messages: [
                {
                  content: trimmedContent,
                  role: 'user',
                  timestamp: Date.now(),
                }
              ]
            });
            setSessionId(conversationId);
          } else {
            await addMessageToConversationMutation({
              userId: userId || '',
              conversationId: sessionId,
              message: {
                content: trimmedContent,
                role: 'user',
                timestamp: Date.now(),
              }
            });
          }
        }

        console.log('Sending message with isFirstMessage:', isFirstMessage, 'backendSessionId:', backendSessionId);

        // Send the enhanced query to the backend (with analysis injected if enabled)
        const data = await sendChatMessage(enhancedQuery, isFirstMessage, backendSessionId, contentContext, includeAnalysisInQuery && !!contentContext?.analysis);

        // Complete the AI processing step
        updateThinkingStep(aiProcessingStep.id, {
          status: 'completed',
          details: [
            'Response received from AI backend',
            `Response length: ${(data.chat_response || data.response || '').length} characters`,
            `Processing time: ${data.metadata?.processing_time_ms || 0}ms`
          ]
        });

        // CRITICAL DEBUG: Check the raw backend response for persona flags
        console.log('🔍 useChat: RAW BACKEND RESPONSE:', JSON.stringify(data, null, 2));
        
        // Handle session ID from backend response
        console.log('[useChat] Received response:', {
          hasSessionId: !!data.session_id,
          currentSessionId: sessionId,
          isFirstMessage,
          isPersonaFlow: data.metadata?.is_persona_flow,
          responseData: data
        });

        // Always use the session ID from the backend if it exists
        if (data.session_id) {
          console.log('[useChat] Received session ID from backend:', data.session_id);
          
          // Only update the session ID if it's different from the current one
          if (sessionId !== data.session_id) {
            console.log('[useChat] Updating session ID from:', sessionId, 'to:', data.session_id);
            setSessionId(data.session_id);
          }
        } 
        // Only generate a new session ID if this is the first message and we don't have one yet
        else if (isFirstMessage && !sessionId) {
          const newSessionId = `frontend_${Date.now()}`;
          console.log('[useChat] Generated new frontend session ID:', newSessionId);
          setSessionId(newSessionId);
        }
        
        // Log the current session state for debugging
        console.log('[useChat] Current session state:', { 
          receivedSessionId: data.session_id, 
          currentSessionId: sessionId,
          isFirstMessage,
          isPersonaFlow: data.metadata?.is_persona_flow,
          hasMetadata: !!data.metadata,
          metadata: data.metadata
        });

        // Update messages with the response
        setMessages(prev => {
          const withoutTyping = prev.filter(msg => msg.status !== 'typing');
          const newMessage: Message = {
            id: uuidv4(),
            content: data.chat_response || data.response || '',
            chat_response: data.chat_response || data.response || '',
            role: 'assistant' as const,
            timestamp: new Date().toISOString(),
            // Use the most reliable session ID in this order: 
            // 1. From backend response
            // 2. Current session ID in state
            // 3. Undefined as last resort
            sessionId: data.session_id || sessionId || undefined,
            // Get suggestions from either the root level or metadata
            suggestions: data.suggestions || data.metadata?.suggestions || [],
            // Properly transfer metadata from API response and include thinking steps
            metadata: {
              ...data.metadata,
              thinking_steps: thinkingSteps,
              processing_time_ms: data.metadata?.processing_time_ms
            }
          };

          // DEBUG: Log the message being added to check persona flags
          console.log('🔍 useChat: Adding new message to state:', {
            messageId: newMessage.id,
            hasMetadata: !!newMessage.metadata,
            metadata: newMessage.metadata,
            is_persona_complete: (newMessage.metadata as any)?.is_persona_complete,
            persona_created: (newMessage.metadata as any)?.persona_created,
            content: newMessage.content?.substring(0, 100) + '...'
          });

          return [...withoutTyping, newMessage];
        });

        // Only update sessionId from backend (never generate a local one for persistence)
        // Only set sessionId if we don't already have a valid one
        const isValidBackendSession = typeof sessionId === 'string' && sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
        if (data.session_id && !isValidBackendSession) {
          console.log('Received session ID from API:', data.session_id);
          setSessionId(data.session_id);
          // Do NOT set conversationSaved(false) here; already set above after user message
        } else if (!sessionId) {
          // If the backend fails to return a sessionId, do not attempt to save or persist
          console.warn('No session ID received from API. Will not persist conversation until backend provides one.');
        } // else: do not set conversationSaved(false) again

        console.log('🚨 Finished processing message successfully');

        setReferencedMessage(null)

      } catch (error) {
        console.error('🚨 Failed to send message:', error)
        
        // Complete the AI processing step with error
        const aiProcessingStep = thinkingSteps.find(step => step.title === 'AI Processing');
        if (aiProcessingStep) {
          updateThinkingStep(aiProcessingStep.id, {
            status: 'error',
            details: ['Failed to get response from AI backend: ' + (error instanceof Error ? error.message : 'Unknown error')]
          });
        }
        
        setMessages(prev => prev.filter(msg => msg.status !== 'typing'))
        setError((error as Error).message)
      } finally {
        setIsLoading(false)
        console.log('🚨 handleSendMessage completed (finally block)');
      }
    })();
  }, [referencedMessage, sessionId, messages.length, setMessages, setSessionId, setIsLoading, setError, contentContext, includeAnalysisInQuery, userId, createConversationMutation, addMessageToConversationMutation, fetchMentionData])

  const handleMessageReference = useCallback((message: Message) => {
    setReferencedMessage(message)
  }, [])

  const handleClearReference = useCallback(() => {
    setReferencedMessage(null)
  }, [])

  const handleOptionClick = useCallback((option: { text: string }) => {
    if (!option?.text) return;
    handleSendMessage(option.text);
  }, [handleSendMessage]);

  const handleFollowUpClick = useCallback((choice: string) => {
    handleSendMessage(choice);
  }, [handleSendMessage]);

  const handleReferenceClick = useCallback((messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
      // Add a brief highlight effect
      messageElement.classList.add('bg-yellow-100/50');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100/50');
      }, 2000);
    }
  }, []);

  return {
    referencedMessage,
    handleSendMessage,
    handleMessageReference,
    handleClearReference,
    handleOptionClick,
    handleFollowUpClick,
    handleReferenceClick
  }
} 