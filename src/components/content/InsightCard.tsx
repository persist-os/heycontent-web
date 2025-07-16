"use client";

import React from 'react';
import { Instagram, Mail, ChevronRight, ArrowRight, MessageSquare } from 'lucide-react';
import { YouTubeBrandIcon } from '@/lib/YoutubeBrandIcon';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useActionStepDiscussion } from '@/app/dashboard/ai-insights/_components/hooks/useActionStepDiscussion';
import { CreateNoteButton } from '@/components/ui/CreateNoteButton';
import { cleanImpactString } from '@/app/lib/utils/impact-utils';
import { useInsightNavigation } from '@/app/dashboard/ai-insights/_components/hooks/useInsightNavigation';
import { useContentContextActions } from '@/store/content-context-store';
import { useRouter } from 'next/navigation';

// Comprehensive insight data interface
export interface InsightData {
  title: string;
  impact: string;
  whyNow: string[];
  actionSteps: string[];
  expectedOutcome: string;
  sourceDetails: string[];
  relatedItems?: Array<{ label: string; value: string }>;
  threadDetails?: Array<{
    threadId: string;
    subject: string;
    from: string;
    snippet: string;
    date: string;
  }>;
}

export interface InsightCardProps {
  platform: 'youtube' | 'instagram' | 'gmail';
  title: string;
  impact: string;
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
  onDiscuss?: (content: string, title: string) => void;
  // Updated to pass both action step and full insight data
  onActionStepClick?: (actionStep: string, insight: InsightData) => void;
  expanded?: boolean;
  onExpand?: () => void;
}

const platformIcon = {
  youtube: <YouTubeBrandIcon href="https://youtube.com/" className="w-8 h-8" />,
  instagram: <Instagram className="w-5 h-5 text-[#C13584]" />,
  gmail: <Mail className="w-5 h-5 text-[#EA4335]" />,
};

// Utility function for comprehensive logging
const logInsightData = (operation: string, data: any, platform: string, additionalInfo?: string) => {
  console.group(`🔍 [INSIGHT CARD] ${operation}`);
  console.log('Platform:', platform);
  console.log('Data Structure:', {
    hasTitle: !!data.title,
    hasImpact: !!data.impact,
    whyNowCount: data.whyNow?.length || 0,
    actionStepsCount: data.actionSteps?.length || 0,
    hasExpectedOutcome: !!data.expectedOutcome,
    sourceDetailsCount: data.sourceDetails?.length || 0,
    relatedItemsCount: data.relatedItems?.length || 0,
    threadDetailsCount: data.threadDetails?.length || 0,
  });
  console.log('Full Data:', data);
  if (additionalInfo) {
    console.log('Additional Info:', additionalInfo);
  }
  console.groupEnd();
};

// Utility function to validate insight data
const validateInsightData = (data: InsightData, platform: string): { isValid: boolean; missingFields: string[] } => {
  const requiredFields = ['title', 'impact', 'whyNow', 'actionSteps', 'expectedOutcome', 'sourceDetails'];
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
      missingFields.push(field);
    }
  });
  
  const isValid = missingFields.length === 0;
  
  if (!isValid) {
    console.warn(`⚠️ [INSIGHT CARD] Missing required fields for ${platform}:`, missingFields);
  }
  
  return { isValid, missingFields };
};

export const InsightCard: React.FC<InsightCardProps> = ({
  platform,
  title,
  impact,
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
  const { navigateWithInsight } = useInsightNavigation();
  const { setContentContext } = useContentContextActions();
  const router = useRouter();

  // Validate platform prop to ensure it's one of the expected values
  const validatedPlatform = ['youtube', 'instagram', 'gmail'].includes(platform) ? platform : 'gmail';

  // Create comprehensive insight data object
  const insightData: InsightData = {
    title,
    impact,
    whyNow,
    actionSteps,
    expectedOutcome,
    sourceDetails,
    relatedItems,
    threadDetails,
  };

  // Validate insight data on component mount
  React.useEffect(() => {
    const validation = validateInsightData(insightData, validatedPlatform);
    logInsightData('Component Mounted', insightData, validatedPlatform, 
      validation.isValid ? 'All fields present' : `Missing: ${validation.missingFields.join(', ')}`);
  }, [insightData, validatedPlatform]);

  // Function to navigate to chat with Gmail thread content
  const discussGmailThread = (thread: any) => {
    console.log('🔍 [INSIGHT CARD] Discussing Gmail thread:', thread);
    
    const context = {
      platform: 'gmail' as const,
      contentId: thread.threadId,
      title: thread.subject || 'Email Thread',
      source: 'AI Insights - Gmail Thread',
      originalPlatform: 'gmail' as const,
      publishedAt: thread.date,
      content: {
        data: {
          subject: thread.subject || 'No Subject',
          from: thread.from || 'Unknown Sender',
          snippet: thread.snippet || 'No preview available',
          threadId: thread.threadId,
          fullContent: thread.snippet || 'No content available'
        }
      },
      analysis: `**Email Thread Analysis**\n\n**Subject:** ${thread.subject || 'No Subject'}\n**From:** ${thread.from || 'Unknown Sender'}\n**Date:** ${thread.date || 'Unknown Date'}\n\n**Content Preview:**\n${thread.snippet || 'No preview available'}\n\nThis email thread was identified as part of your ${title.toLowerCase()} opportunities. You can discuss strategies, draft responses, or analyze the content with AI assistance.`
    };
    
    logInsightData('Setting Gmail Thread Context', context, validatedPlatform);
    setContentContext(context);
    router.push('/dashboard/chat');
  };

  // Function to navigate to chat with the full insight context
  const discussFullInsight = () => {
    console.log('🔍 [INSIGHT CARD] Discussing full insight');
    logInsightData('Full Insight Discussion', insightData, validatedPlatform);
    
    const validation = validateInsightData(insightData, validatedPlatform);
    if (!validation.isValid) {
      console.error('❌ [INSIGHT CARD] Cannot discuss insight - missing required fields:', validation.missingFields);
      return;
    }
    
    navigateWithInsight(insightData, validatedPlatform);
  };

  // Enhanced action step handler with comprehensive logging
  const handleActionStepClick = (step: string, stepIndex: number) => {
    console.group(`🔍 [INSIGHT CARD] Action Step Clicked`);
    console.log('Step Index:', stepIndex);
    console.log('Step Content:', step);
    console.log('Platform:', validatedPlatform);
    console.log('Full Insight Data:', insightData);
    
    const validation = validateInsightData(insightData, validatedPlatform);
    if (!validation.isValid) {
      console.error('❌ [INSIGHT CARD] Cannot process action step - missing required fields:', validation.missingFields);
      console.groupEnd();
      return;
    }

    // Create additional context for the action step
    const additionalContext = [
      `Platform: ${validatedPlatform.toUpperCase()}`,
      `Insight: ${title}`,
      `Impact: ${impact}`,
      `Why Now: ${whyNow.join(', ')}`,
      `Expected Outcome: ${expectedOutcome}`,
      `Action Step Index: ${stepIndex + 1} of ${actionSteps.length}`,
      `Total Action Steps: ${actionSteps.length}`
    ].join('\n');

    console.log('Additional Context:', additionalContext);

    if (onActionStepClick) {
      console.log('🔍 [INSIGHT CARD] Using custom action step handler');
      onActionStepClick(step, insightData);
    } else {
      console.log('🔍 [INSIGHT CARD] Using default action step handler');
      discussActionStep(step, insightData, validatedPlatform, additionalContext);
    }
    
    console.groupEnd();
  };

  const formatInsightForNote = () => {
    const cleanImpact = cleanImpactString(impact);
    return `\n# ${title}\n\n**Platform:** ${validatedPlatform.toUpperCase()}\n**Impact:** ${cleanImpact}\n\n### Why Now?\n${whyNow.map(reason => `• ${reason}`).join('\n')}\n\n### Action Steps\n${actionSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}\n\n### Expected Outcome\n${expectedOutcome}\n\n### Source Details\n${sourceDetails.join('\n')}\n\n${relatedItems && relatedItems.length > 0 ? `### Related Items\n${relatedItems.map(item => `• ${item.label}: ${item.value}`).join('\n')}` : ''}`.trim();
  };

  const getPlatformShadow = () => {
    switch (validatedPlatform) {
      case 'youtube':
        return 'hover:shadow-xl hover:shadow-red-500/25 border-2 border-transparent hover:border-red-500/30';
      case 'instagram':
        return 'hover:shadow-xl hover:shadow-pink-500/25 border-2 border-transparent hover:border-pink-500/30';
      case 'gmail':
        return 'hover:shadow-xl hover:shadow-blue-500/25 border-2 border-transparent hover:border-blue-500/30';
      default:
        return 'hover:shadow-xl hover:shadow-heycontent-yellow/25 border-2 border-transparent hover:border-heycontent-yellow/30';
    }
  };

  return (
    <Card className={`overflow-hidden transition-all duration-300 cursor-pointer ${getPlatformShadow()}`} onClick={onExpand}>
      {/* Collapsed Header */}
      <div
        className={`flex items-center justify-between p-4 transition-all duration-200 ${
          expanded 
            ? 'bg-heycontent-yellow/10 rounded-t-lg border-b border-heycontent-yellow/20'
            : 'bg-white dark:bg-gray-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-all duration-200 ${
            expanded 
              ? 'bg-heycontent-yellow/20 dark:bg-heycontent-yellow/10'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            {platformIcon[validatedPlatform]}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-text-dark dark:text-white">{title}</h3>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize transition-all duration-200 ${
                expanded 
                  ? 'bg-heycontent-yellow/30 dark:bg-heycontent-yellow/20 text-text-dark dark:text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-text-dark dark:text-white'
              }`}>
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
              <h4 className="font-medium dark:text-white">Related Emails</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {threadDetails.map((thread, idx) => (
                  <div 
                    key={idx} 
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer transition-colors"
                    onClick={() => discussGmailThread(thread)}
                  >
                    <div className="flex items-start justify-between">
                      <span className="flex-1 mr-2">
                        • {thread.subject
                            ? (thread.subject.startsWith('Re: ') ? thread.subject : `Re: ${thread.subject}`)
                            : 'No Subject'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                        ({thread.date || 'Unknown Date'})
                      </span>
                    </div>
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
                    handleActionStepClick(step, idx);
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
            <h4 className="font-medium text-green-800 dark:text-green-900 mb-2">Expected Outcome</h4>
            <p className="text-sm text-green-700 dark:text-green-800">{expectedOutcome}</p>
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
              className="flex-1 bg-primary text-primary-foreground dark:text-black hover:bg-primary/90 hover:text-primary-foreground dark:hover:text-black"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Discuss With Content
            </Button>

            <CreateNoteButton
              content={formatInsightForNote()}
              onNoteCreate={() => {
                // Optionally add some feedback to the user, like a toast.
                // For now, it just creates the note and navigates.
              }}
              className="flex-1"
            />
            
            {/* Legacy discuss button if provided */}
            {onDiscuss && (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDiscuss(actionSteps.join('\n'), title);
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