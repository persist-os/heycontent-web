import React from 'react';
import { ContextBox } from '../main_chat/ContextBox';

interface ChatContextBoxProps {
  currentContext: any;
  messages: any[];
  onRemove: () => void;
  includeAnalysisInQuery: boolean;
  onToggleAnalysis: (val: boolean) => void;
  onSendMessage: (msg: string) => void;
  onInputPopulate?: (msg: string) => void;
}

const ChatContextBox: React.FC<ChatContextBoxProps> = ({
  currentContext,
  messages,
  onRemove,
  includeAnalysisInQuery,
  onToggleAnalysis,
  onSendMessage,
  onInputPopulate,
}) => {
  if (!currentContext) return null;
  
  // For Gmail context, try to get enriched metadata from the latest assistant message
  let enrichedContext = currentContext;
  if (currentContext.platform === 'gmail' && messages.length > 0) {
    // Find the latest assistant message with Gmail metadata
    const latestGmailMessage = messages
      .filter(msg => msg.role === 'assistant' && msg.metadata?.platform_context === 'gmail')
      .slice(-1)[0]; // Get the most recent one
    
    if (latestGmailMessage?.metadata) {
      // Merge the metadata into the context for display
      enrichedContext = {
        ...currentContext,
        messageCount: latestGmailMessage.metadata.message_count,
        hasFullThread: latestGmailMessage.metadata.has_full_thread,
        threadId: latestGmailMessage.metadata.thread_id || currentContext.contentId,
      };
    }
  }

  
  return (
    <div className="shrink-0">
      <ContextBox 
        context={enrichedContext} 
        onRemove={onRemove}
        includeAnalysisInQuery={includeAnalysisInQuery}
        onToggleAnalysis={onToggleAnalysis}
      />
      {/* Platform-specific suggestions for content with analysis */}
      {currentContext.analysis && messages.length === 0 && (
        <div className="mt-4 p-3 sm:p-4 bg-muted/50 rounded-lg border border-border mx-3 sm:mx-0">
          <h4 className="text-sm font-medium text-foreground mb-3">
            What would you like to explore?
          </h4>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(currentContext.platform === 'youtube' ? [
              "What made this video resonate?",
              "How can I improve my storytelling?",
              "What should I try differently next time?",
              "Why did this connect with viewers?",
              "What's my strongest content element?"
            ] : currentContext.platform === 'instagram' ? [
              "What made this post engaging?",
              "How can I improve my visual style?",
              "What resonates with my audience?",
              "How can I tell better stories?",
              "What should I focus on next?"
            ] : currentContext.platform === 'ai-insights' || currentContext.type === 'content-hub-insight' ? [
              "How can I make this my own?",
              "What would this look like for my content?",
              "How can I start experimenting with this?",
              "What's the easiest way to try this?",
              "How can I test this with my audience?",
              "What creative twist can I add?"
            ] : [
              "What are the key insights?",
              "How can I improve this content?",
              "What patterns do you notice?",
              "What should I focus on?",
              "How can I grow from this?"
            ]).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSendMessage(suggestion)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-background border border-border rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors break-words"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* YouTube content suggestions (when no analysis available) */}
      {currentContext.platform === 'youtube' && !currentContext.analysis && messages.length === 0 && (
        <div className="mt-4 p-3 sm:p-4 bg-muted/50 rounded-lg border border-border mx-3 sm:mx-0">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Questions about your video
          </h4>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {[
              "How can I make my intro more engaging?",
              "What video format works best for this topic?",
              "How can I improve my thumbnail strategy?",
              "What would make viewers stay longer?",
              "How can I better connect with my audience?",
              "What topics should I cover next?"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSendMessage(suggestion)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-background border border-border rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors break-words"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Instagram content suggestions (when no analysis available) */}
      {currentContext.platform === 'instagram' && !currentContext.analysis && messages.length === 0 && (
        <div className="mt-4 p-3 sm:p-4 bg-muted/50 rounded-lg border border-border mx-3 sm:mx-0">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Questions about your post
          </h4>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {[
              "How can I write more engaging captions?",
              "What visual style should I develop?",
              "How can I spark better conversations?",
              "What content format works best for me?",
              "How can I show more personality?",
              "What stories should I tell?"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSendMessage(suggestion)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-background border border-border rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors break-words"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Gmail-specific context-aware suggestions */}
      {currentContext.platform === 'gmail' && !currentContext.analysis && messages.length === 0 && (
        <div className="mt-4 p-3 sm:p-4 bg-muted/50 rounded-lg border border-border mx-3 sm:mx-0">
          <h4 className="text-sm font-medium text-foreground mb-3">
            {enrichedContext.hasFullThread && (enrichedContext.messageCount || 0) > 1 
              ? "Questions about this email thread" 
              : "Questions about this email"}
          </h4>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(enrichedContext.hasFullThread && (enrichedContext.messageCount || 0) > 1 ? [
              "How should I respond to this thread?",
              "What's the main conversation about?",
              "Who should I follow up with?",
              "What are the key decisions made?",
              "Help me understand the context",
              "What's the tone of this conversation?",
              "How can I add value to this discussion?",
              "What questions haven't been answered?"
            ] : [
              "What's the main message here?",
              "How should I respond to this?",
              "What's the sender's intent?",
              "How urgent is this email?",
              "What context am I missing?",
              "How can I respond thoughtfully?"
            ]).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSendMessage(suggestion)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-background border border-border rounded-md hover:bg-muted hover:text-foreground text-muted-foreground transition-colors break-words"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContextBox; 