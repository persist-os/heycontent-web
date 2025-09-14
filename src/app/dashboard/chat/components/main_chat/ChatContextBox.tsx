import React, { useState } from 'react';
import { Instagram, Mail, X, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!currentContext) return null;
  
  // For Gmail context, try to get enriched metadata from the latest assistant message
  let enrichedContext = currentContext;
  if (currentContext.platform === 'gmail' && messages.length > 0) {
    const latestGmailMessage = messages
      .filter(msg => msg.role === 'assistant' && msg.metadata?.platform_context === 'gmail')
      .slice(-1)[0];
    
    if (latestGmailMessage?.metadata) {
      enrichedContext = {
        ...currentContext,
        messageCount: latestGmailMessage.metadata.message_count,
        hasFullThread: latestGmailMessage.metadata.has_full_thread,
        threadId: latestGmailMessage.metadata.thread_id || currentContext.contentId,
      };
    }
  }

  // Get platform info
  const getPlatformInfo = () => {
    switch (currentContext.platform) {
      case 'youtube':
        return {
          icon: null,
          name: 'YouTube',
          contentType: 'video'
        };
      case 'gmail':
        return {
          icon: <Mail className="w-4 h-4 text-blue-500" />,
          name: 'Gmail',
          contentType: enrichedContext.hasFullThread && (enrichedContext.messageCount || 0) > 1 ? 'thread' : 'email'
        };
      default:
        return {
          icon: null,
          name: currentContext.platform,
          contentType: 'content'
        };
    }
  };

  const platformInfo = getPlatformInfo();

  // Get external link
  const getExternalLink = () => {
    switch (currentContext.platform) {
      case 'youtube':
        return `https://www.youtube.com/watch?v=${currentContext.contentId}`;
      case 'gmail':
        return null; // Gmail doesn't have external links
      default:
        return null;
    }
  };

  const externalLink = getExternalLink();
  
  return (
    <div className="relative z-10 mb-4">
      {/* Collapsed state - minimal, unobtrusive */}
      <div className="bg-background/80 backdrop-blur-sm border border-border/20 rounded-lg">
        <div className="flex items-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors duration-300 rounded-l-lg min-w-0"
          >
            {platformInfo.icon}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {currentContext.title || `${platformInfo.name} ${platformInfo.contentType}`}
              </p>
              {!isExpanded && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {currentContext.platform === 'gmail' && currentContext.content?.messages?.[0]?.from && 
                    `From ${currentContext.content.messages[0].from}`}
                  {currentContext.platform === 'youtube' && currentContext.content?.channelTitle && 
                    `By ${currentContext.content.channelTitle}`}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 ml-2">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </button>
          
          {onRemove && (
              <button
              onClick={onRemove}
              className="flex-shrink-0 p-3 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors duration-300 rounded-r-lg"
              title="Remove context"
            >
              <X className="w-3 h-3" />
              </button>
          )}
        </div>

        {/* Expanded state - larger, more detailed */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-6">
            <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
            
            {/* Title and basic info */}
            {currentContext.title && (
              <div className="mb-4">
                <h3 className="text-lg font-medium text-foreground leading-relaxed">
                  {currentContext.title}
                </h3>
              </div>
            )}

            {/* Platform-specific metadata in compact row */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
              {currentContext.platform === 'gmail' && (
                <>
                  {enrichedContext.messageCount && enrichedContext.messageCount > 1 && (
                    <span>{enrichedContext.messageCount} messages</span>
                  )}
                  {currentContext.content?.messages?.[0]?.from && (
                    <span>From {currentContext.content.messages[0].from}</span>
                  )}
                  {currentContext.content?.messages?.[0]?.date && (
                    <span>{new Date(currentContext.content.messages[0].date).toLocaleDateString()}</span>
                  )}
                </>
              )}

              {currentContext.platform === 'youtube' && currentContext.content && (
                <>
                  {currentContext.content.channelTitle && (
                    <span>By {currentContext.content.channelTitle}</span>
                  )}
                  {currentContext.content.duration && (
                    <span>{currentContext.content.duration}</span>
                  )}
                  {currentContext.metrics && (
                    <>
                      {currentContext.metrics.views > 0 && (
                        <span>{currentContext.metrics.views.toLocaleString()} views</span>
                      )}
                      {currentContext.metrics.likes > 0 && (
                        <span>{currentContext.metrics.likes.toLocaleString()} likes</span>
                      )}
                    </>
                  )}
                </>
              )}


              {/* External link */}
              {externalLink && (
                <a
                  href={externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  View on {platformInfo.name}
                </a>
              )}
            </div>

            {/* Main content area - full width and prominent */}
            <div className="space-y-6">
              {/* Thumbnail at top if available */}
              {currentContext.thumbnailUrl && (
                <div className="flex justify-center">
                  <img
                    src={currentContext.thumbnailUrl}
                    alt="Content preview"
                    className="rounded object-cover w-80 h-48"
                  />
                </div>
              )}

              {/* Actual content - full width and larger */}
              {(currentContext.content || currentContext.analysis) && (
                <div className="space-y-4">
                  {/* Gmail content */}
                  {currentContext.platform === 'gmail' && currentContext.content?.messages && (
                    <div className="space-y-4">
                      {currentContext.content.messages.slice(0, 3).map((message: any, index: number) => (
                        <div key={index} className="bg-muted/20 rounded-lg p-4 space-y-3">
                          {message.subject && index === 0 && (
                            <h5 className="font-medium text-foreground">{message.subject}</h5>
                          )}
                          {message.body && (
                            <div className="text-sm text-muted-foreground max-h-48 overflow-y-auto leading-relaxed">
                              {message.body.length > 1000 
                                ? `${message.body.substring(0, 1000)}...` 
                                : message.body}
                            </div>
                          )}
                        </div>
                      ))}
                      {currentContext.content.messages.length > 3 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{currentContext.content.messages.length - 3} more messages in this thread
                        </p>
                      )}
                    </div>
                  )}

                  {/* YouTube content */}
                  {currentContext.platform === 'youtube' && (
                    <div className="space-y-4">
                      {currentContext.content?.description && (
                        <div className="bg-muted/20 rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-3">Description</h5>
                          <div className="text-sm text-muted-foreground max-h-48 overflow-y-auto leading-relaxed">
                            {currentContext.content.description.length > 1000 
                              ? `${currentContext.content.description.substring(0, 1000)}...` 
                              : currentContext.content.description}
                          </div>
                        </div>
                      )}
                      {currentContext.content?.transcript && (
                        <div className="bg-muted/20 rounded-lg p-4">
                          <h5 className="font-medium text-foreground mb-3">Transcript</h5>
                          <div className="text-sm text-muted-foreground max-h-48 overflow-y-auto leading-relaxed">
                            {currentContext.content.transcript.length > 1000 
                              ? `${currentContext.content.transcript.substring(0, 1000)}...` 
                              : currentContext.content.transcript}
                          </div>
                        </div>
                      )}
                    </div>
                  )}


                  {/* Insights content - removed "Analysis" label */}
                  {currentContext.analysis && (
                    <div className="bg-muted/20 rounded-lg p-4">
                      <div className="text-sm text-muted-foreground max-h-60 overflow-y-auto leading-relaxed">
                        {typeof currentContext.analysis === 'string' 
                          ? currentContext.analysis 
                          : JSON.stringify(currentContext.analysis, null, 2)}
          </div>
        </div>
      )}
      
                  {/* Generic content fallback */}
                  {currentContext.content && typeof currentContext.content === 'string' && (
                    <div className="bg-muted/20 rounded-lg p-4">
                      <div className="text-sm text-muted-foreground max-h-48 overflow-y-auto leading-relaxed">
                        {currentContext.content.length > 1000 
                          ? `${currentContext.content.substring(0, 1000)}...` 
                          : currentContext.content}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Analysis toggle */}
            {onToggleAnalysis && (
              <div className="pt-2">
              <button
                  onClick={() => onToggleAnalysis(!includeAnalysisInQuery)}
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-300"
                >
                  <div className={`w-6 h-px transition-colors duration-300 ${
                    includeAnalysisInQuery ? 'bg-foreground' : 'bg-border'
                  }`} />
                  <span className="text-sm">
                    {includeAnalysisInQuery ? 'Including insights in conversation' : 'Basic context only'}
                  </span>
              </button>
              </div>
            )}
          </div>
        )}
        </div>
    </div>
  );
};

export default ChatContextBox; 