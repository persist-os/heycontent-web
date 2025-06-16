import React from 'react';
import { Instagram, Mail, ChevronRight, ArrowRight, MessageSquare } from 'lucide-react';
import { YouTubeBrandIcon } from '../../_components/YoutubeBrandIcon';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useActionStepDiscussion } from './hooks/useActionStepDiscussion';

export interface InsightCardProps {
  platform: 'youtube' | 'instagram' | 'gmail';
  title: string;
  impact: string;
  highlightColor?: string;
  whyNow: string[];
  actionSteps: string[];
  expectedOutcome: string;
  outcomeColor?: string;
  sourceDetails: string[];
  relatedItems?: Array<{ label: string; value: string }>;
  threadDetails?: Array<{
    threadId: string;
    subject: string;
    from: string;
    snippet: string;
    date: string;
  }>;
  onDiscuss?: () => void;
  onActionStepClick?: (actionStep: string) => void;
  expanded?: boolean;
  onExpand?: () => void;
}

const platformIcon = {
  youtube: <YouTubeBrandIcon href="https://youtube.com/" className="w-8 h-8" />,
  instagram: <Instagram className="w-5 h-5 text-[#C13584]" />,
  gmail: <Mail className="w-5 h-5 text-[#EA4335]" />,
};

export const InsightCard: React.FC<InsightCardProps> = ({
  platform,
  title,
  impact,
  highlightColor = 'bg-heycontent-light-yellow',
  whyNow,
  actionSteps,
  expectedOutcome,
  outcomeColor = 'bg-heycontent-light-green',
  sourceDetails,
  relatedItems,
  threadDetails,
  onDiscuss,
  onActionStepClick,
  expanded = false,
  onExpand,
}) => {
  const { discussActionStep } = useActionStepDiscussion();

  // Validate platform prop to ensure it's one of the expected values
  const validatedPlatform = ['youtube', 'instagram', 'gmail'].includes(platform) ? platform : 'gmail';
  
  // Add platform-specific validation for content
  const validatePlatformContent = () => {
    if (validatedPlatform === 'gmail' && !title.toLowerCase().includes('email') && !title.toLowerCase().includes('gmail') && !title.toLowerCase().includes('partnership') && !title.toLowerCase().includes('media') && !title.toLowerCase().includes('business')) {
      console.warn(`Gmail insight with unexpected title: ${title}`);
    }
    if (validatedPlatform === 'youtube' && title.toLowerCase().includes('email')) {
      console.warn(`YouTube insight with email-related title: ${title}`);
    }
  };

  // Run validation in development
  if (process.env.NODE_ENV === 'development') {
    validatePlatformContent();
  }

  // Function to navigate to chat with Gmail thread content
  const discussGmailThread = (thread: any) => {
    const context = {
      platform: 'gmail', // Explicitly set to gmail
      contentId: thread.threadId,
      title: thread.subject || 'Email Thread',
      source: 'AI Insights - Gmail Thread',
      originalPlatform: 'gmail', // Ensure original platform is set
      publishedAt: thread.date,
      content: {
        data: {
          subject: thread.subject || 'No Subject',
          from: thread.from || 'Unknown Sender',
          snippet: thread.snippet || 'No preview available',
          threadId: thread.threadId,
          // Add the full thread content for context
          fullContent: thread.snippet || 'No content available'
        }
      },
      // Create a formatted analysis of the email thread
      analysis: `**Email Thread Analysis**

**Subject:** ${thread.subject || 'No Subject'}
**From:** ${thread.from || 'Unknown Sender'}
**Date:** ${thread.date || 'Unknown Date'}

**Content Preview:**
${thread.snippet || 'No preview available'}

This email thread was identified as part of your ${title.toLowerCase()} opportunities. You can discuss strategies, draft responses, or analyze the content with AI assistance.`
    };
    
    const encodedContext = encodeURIComponent(JSON.stringify(context));
    window.location.href = `/dashboard/chat?contentContext=${encodedContext}`;
  };

  // Function to navigate to chat with the full insight context
  const discussFullInsight = () => {
    const cleanImpact = impact.replace(/^Impact:\s*/i, '');
    const fullInsightContext = {
      platform: 'ai-insights',
      contentId: `insight-${Date.now()}`,
      title: title,
      source: 'AI Insights Dashboard',
      originalPlatform: validatedPlatform, // Use validated platform
      fullInsight: {
        title,
        impact: cleanImpact,
        whyNow,
        actionSteps,
        expectedOutcome,
        sourceDetails,
        relatedItems
      },
      // Create a formatted analysis of the insight (no title at the top)
      analysis: `**Platform:** ${validatedPlatform.toUpperCase()}
**Impact:** ${cleanImpact}

### Why Now?
${whyNow.map(reason => `• ${reason}`).join('\n')}

### Action Steps
${actionSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

### Expected Outcome
${expectedOutcome}

### Source Details
${sourceDetails.join('\n')}

${relatedItems && relatedItems.length > 0 ? `### Related Items\n${relatedItems.map(item => `• ${item.label}: ${item.value}`).join('\n')}` : ''}`
    };
    
    const encodedContext = encodeURIComponent(JSON.stringify(fullInsightContext));
    window.location.href = `/dashboard/chat?contentContext=${encodedContext}`;
  };

  return (
    <Card className="overflow-hidden transition-shadow cursor-pointer hover:shadow-lg" onClick={onExpand}>
      {/* Collapsed Header */}
      <div
        className={`flex items-center justify-between p-4 ${highlightColor} ${expanded ? 'rounded-t-lg' : 'rounded-lg'}`}
      >
        <div className="flex items-center gap-3">
          {validatedPlatform === 'youtube' ? (
            <div>{platformIcon[validatedPlatform]}</div>
          ) : (
            <div className="p-2 rounded-lg bg-white/80 dark:bg-black/30">
              {platformIcon[validatedPlatform]}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-text-dark dark:text-white">{title}</h3>
              <span className="px-2 py-0.5 bg-white/60 dark:bg-black/40 text-xs font-medium rounded-full capitalize text-text-dark dark:text-white">
                {validatedPlatform}
              </span>
            </div>
            <p className="text-sm text-text-gray dark:text-gray-400">{impact}</p>
          </div>
        </div>
        <ChevronRight
          className={`w-5 h-5 text-text-gray transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        />
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 space-y-6" onClick={e => e.stopPropagation()}>
          {/* Why Now Section */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
            <h4 className="font-medium dark:text-white">Why Now?</h4>
            <ul className="space-y-2">
              {whyNow.map((reason, idx) => (
                <li key={idx} className="text-sm text-text-gray dark:text-gray-400 flex items-start gap-2">
                  <span className="mt-1">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Thread Details - Only show for Gmail platform */}
          {validatedPlatform === 'gmail' && threadDetails && threadDetails.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
              <h4 className="font-medium dark:text-white">Email Threads ({threadDetails.length})</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {threadDetails.map((thread, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => discussGmailThread(thread)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-sm text-text-dark dark:text-white truncate flex-1 mr-2">
                        {thread.subject}
                      </h5>
                      <span className="text-xs text-text-gray dark:text-gray-400 whitespace-nowrap">
                        {thread.date}
                      </span>
                    </div>
                    <p className="text-xs text-text-gray dark:text-gray-400 mb-2">
                      From: {thread.from}
                    </p>
                    <p className="text-xs text-text-gray dark:text-gray-400 line-clamp-2">
                      {thread.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Steps */}
          <div>
            <h4 className="font-medium dark:text-white mb-3">Action Steps</h4>
            <div className="space-y-2">
              {actionSteps.map((step, idx) => (
                <button
                  key={idx}
                  className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onActionStepClick) {
                      onActionStepClick(step);
                    } else {
                      // Get additional context from why now and expected outcome
                      const additionalContext = [
                        `Platform: ${validatedPlatform.toUpperCase()}`,
                        `Insight: ${title}`,
                        `Impact: ${impact}`,
                        `Why Now: ${whyNow.join(', ')}`,
                        `Expected Outcome: ${expectedOutcome}`
                      ].join('\n');
                      
                      // Use the custom hook to navigate to chat with rich context
                      discussActionStep(step, title, validatedPlatform, additionalContext);
                    }
                  }}
                >
                  <span className="text-sm dark:text-gray-300 group-hover:text-heycontent-purple dark:group-hover:text-heycontent-purple transition-colors">{step}</span>
                  <ArrowRight className="w-4 h-4 text-text-gray group-hover:text-heycontent-purple dark:group-hover:text-heycontent-purple transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Expected Outcome */}
          <div className={`${outcomeColor} p-4 rounded-lg`}>
            <h4 className="font-medium text-text-dark dark:text-heycontent-green mb-2">Expected Outcome</h4>
            <p className="text-sm text-text-dark dark:text-heycontent-green">{expectedOutcome}</p>
          </div>

          {/* Source Details Section */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium dark:text-white mb-2">Source Details</h4>
            <div className="mb-2">
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full capitalize">
                {validatedPlatform} Insight
              </span>
            </div>
            {sourceDetails.map((detail, idx) => (
              <p key={idx} className="text-sm text-text-gray dark:text-gray-400 mb-1">{detail}</p>
            ))}
            {relatedItems && relatedItems.length > 0 && (
              <div className="mt-2">
                <h5 className="text-sm font-medium dark:text-white mb-1">Related Items</h5>
                <div className="max-h-32 overflow-y-auto">
                  {relatedItems.map((item, idx) => (
                    <div key={idx} className="text-xs text-text-gray dark:text-gray-400 mb-1">
                      • {item.label}: {item.value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                discussFullInsight();
              }}
              className="flex-1 bg-heycontent-light-yellow hover:bg-heycontent-yellow/90 text-black"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Discuss Full Insight
            </Button>
            
            {/* Legacy discuss button if provided */}
            {onDiscuss && (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDiscuss();
                }}
                className="flex-1"
              >
                Discuss Individual Steps
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}; 