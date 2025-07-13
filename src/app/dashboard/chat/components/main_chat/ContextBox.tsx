import React from 'react';
import { Card } from '@/components/ui/card';
import { Instagram, Mail, X, ExternalLink, Brain, Sparkles, ToggleLeft, ToggleRight, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { YouTubeBrandIcon } from '../../../../../lib/YoutubeBrandIcon';
import { ContentContext } from '../../types';
import { MarkdownRenderer } from '../../markdown-renderer';
import AIInsightDisplayCard from './AIInsightDisplayCard';
import { processContentIfNeeded } from '../../../content-analytics/utils/markdown-processor';
import { useState } from 'react';

interface ContextBoxProps {
  context: ContentContext;
  onRemove?: () => void;
  includeAnalysisInQuery?: boolean;
  onToggleAnalysis?: (enabled: boolean) => void;
}

// Helper function for context origin title
function getContextOriginTitle(platform: string, originalPlatform?: string) {
  if (platform === 'instagram') return 'AI Insights for Instagram';
  if (platform === 'youtube') return 'AI Insights for YouTube';
  if (platform === 'gmail') return 'Gmail Content Strategy';
  if (platform === 'ai-insights') {
    if (originalPlatform === 'instagram') return 'AI Insights for Instagram';
    if (originalPlatform === 'youtube') return 'AI Insights for YouTube';
    if (originalPlatform === 'gmail') return 'Gmail Content Strategy';
  }
  return 'AI Insights';
}

export const ContextBox: React.FC<ContextBoxProps> = ({ 
  context, 
  onRemove, 
  includeAnalysisInQuery = true,
  onToggleAnalysis 
}) => {
  // Platform Content Strategy (Gmail, Instagram, YouTube)
  if (["gmail", "instagram", "youtube"].includes(context.platform)) {
    let platformIcon = null;
    if (context.platform === 'youtube') {
      platformIcon = <YouTubeBrandIcon href="https://youtube.com/" className="w-8 h-8 min-w-[20px] min-h-[20px]" />;
    } else if (context.platform === 'instagram') {
      platformIcon = <Instagram className="w-6 h-6 text-pink-500" />;
    } else if (context.platform === 'gmail') {
      platformIcon = <Mail className="w-6 h-6 text-blue-500" />;
    }
    return (
      <Card className="w-full border border-[#4E87E3] bg-[#2A3A5A] dark:bg-[#1A2332] rounded-xl px-0 py-0 mb-4">
        {/* Main Title Header */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-3 border-b border-[#B3D4FC] dark:border-[#2A3A5A]">
          {platformIcon}
          <span className="block text-lg font-bold text-white dark:text-white">
            {getContextOriginTitle(context.platform)}
          </span>
        </div>
        <div className="flex flex-col gap-2 px-4 pb-4 pt-2">
          {/* Strategy Card */}
          <Card className="w-full border border-[#B3D4FC] dark:border-[#2A3A5A] bg-[#1A2332] dark:bg-[#111827] rounded-lg px-4 py-3 mb-2">
            {'hook' in context && context.hook && (
              <div className="mb-2">
                <div className="font-semibold text-sm mb-1 text-blue-200 dark:text-blue-300">
                  Hook
                </div>
                <div className="text-base text-blue-100 dark:text-blue-100">
                  <MarkdownRenderer content={String(context.hook)} />
                </div>
              </div>
            )}
            {'format' in context && context.format && (
              <div className="mb-2">
                <div className="font-semibold text-sm mb-1 text-blue-200 dark:text-blue-300">
                  Format
                </div>
                <div className="text-base text-blue-100 dark:text-blue-100">
                  <MarkdownRenderer content={String(context.format)} />
                </div>
              </div>
            )}
            {'callToAction' in context && context.callToAction && (
              <div className="mb-2">
                <div className="font-semibold text-sm mb-1 text-blue-200 dark:text-blue-300">
                  Call to Action
                </div>
                <div className="text-base text-blue-100 dark:text-blue-100">
                  <MarkdownRenderer content={String(context.callToAction)} />
                </div>
              </div>
            )}
          </Card>
          {/* Context Toggle Card (unchanged) */}
          <Card className="w-full border border-[#B3D4FC] dark:border-[#2A3A5A] bg-[#1A2332] dark:bg-[#111827] rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="block text-base font-semibold text-blue-200 dark:text-blue-300">
                Context
              </span>
              {onToggleAnalysis && (
                <button
                  onClick={() => onToggleAnalysis(!includeAnalysisInQuery)}
                  className={`flex items-center gap-1 text-sm transition-colors ${includeAnalysisInQuery ? 'text-blue-200 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'} hover:text-blue-100 dark:hover:text-blue-100`}
                  title={includeAnalysisInQuery ? "Disable insight context" : "Enable insight context"}
                >
                  {includeAnalysisInQuery ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-blue-200 dark:text-blue-300" />
                      <span>ON</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>OFF</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="text-base font-normal text-left text-blue-100 dark:text-blue-100">
              {includeAnalysisInQuery 
                ? 'Insight included in questions'
                : 'Insight not included in questions'
              }
            </div>
          </Card>
        </div>
      </Card>
    );
  }

  // Content Hub Insights
  if (context.platform === 'content-hub-insight' || ('type' in context && context.type === 'content-hub-insight')) {
    let platformIcon = <Sparkles className="w-6 h-6 text-[#4E87E3]" />;
    return (
      <Card className="w-full border border-[#4E87E3] bg-[#2A3A5A] dark:bg-[#1A2332] rounded-xl px-0 py-0 mb-4">
        {/* Main Title Header */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-3 border-b border-[#B3D4FC] dark:border-[#2A3A5A]">
          {platformIcon}
          <span className="block text-lg font-bold text-white dark:text-white">
            Content Hub Insights
          </span>
        </div>
        <div className="flex flex-col gap-2 px-4 pb-4 pt-2">
          {/* Insight Card */}
          <Card className="w-full border border-[#B3D4FC] dark:border-[#2A3A5A] bg-[#1A2332] dark:bg-[#111827] rounded-lg px-4 py-3 mb-2">
            {context.title && (
              <span className="block text-base font-semibold mb-2 text-blue-200 dark:text-blue-300">
                {context.title}
              </span>
            )}
            {context.content && (
              <div className="text-base text-blue-100 dark:text-blue-100">
                <MarkdownRenderer content={String(context.content)} />
              </div>
            )}
          </Card>
          {/* Context Toggle Card (unchanged) */}
          <Card className="w-full border border-[#B3D4FC] dark:border-[#2A3A5A] bg-[#1A2332] dark:bg-[#111827] rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="block text-base font-semibold text-blue-200 dark:text-blue-300">
                Context
              </span>
              {onToggleAnalysis && (
                <button
                  onClick={() => onToggleAnalysis(!includeAnalysisInQuery)}
                  className={`flex items-center gap-1 text-sm transition-colors ${includeAnalysisInQuery ? 'text-blue-200 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'} hover:text-blue-100 dark:hover:text-blue-100`}
                  title={includeAnalysisInQuery ? "Disable insight context" : "Enable insight context"}
                >
                  {includeAnalysisInQuery ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-blue-200 dark:text-blue-300" />
                      <span>ON</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>OFF</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="text-base font-normal text-left text-blue-100 dark:text-blue-100">
              {includeAnalysisInQuery 
                ? 'Insight included in questions'
                : 'Insight not included in questions'
              }
            </div>
          </Card>
        </div>
      </Card>
    );
  }

  // AI Insights
  if (context.platform === 'ai-insights' && (context as any).fullInsight) {
    const originalPlatform = (context as any).originalPlatform;
    let platformIcon = null;
    if (originalPlatform === 'youtube') {
      platformIcon = <YouTubeBrandIcon href="https://youtube.com/" className="w-8 h-8 min-w-[20px] min-h-[20px]" />;
    } else if (originalPlatform === 'instagram') {
      platformIcon = <Instagram className="w-6 h-6 text-pink-500" />;
    } else if (originalPlatform === 'gmail') {
      platformIcon = <Mail className="w-6 h-6 text-blue-500" />;
    } else {
      platformIcon = <Brain className="w-6 h-6 text-gray-600 dark:text-gray-400 flex-shrink-0" />;
    }
    const insight = (context as any).fullInsight;
    // Collapsible state for insight and action item cards
    const [insightOpen, setInsightOpen] = useState(false);
    const [actionOpen, setActionOpen] = useState(true);
    return (
      <Card className="w-full border border-[#4E87E3] bg-[#2A3A5A] dark:bg-[#1A2332] rounded-xl px-0 py-0 mb-4">
        {/* Main Title Header */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-3 border-b border-[#B3D4FC] dark:border-[#2A3A5A]">
              {platformIcon}
          <span className="block text-lg font-bold text-white dark:text-white">
            {getContextOriginTitle(context.platform, context.originalPlatform)}
          </span>
            </div>
        <div className="flex flex-col gap-2 px-4 pb-4 pt-2">
          {/* Insight Card (collapsible) */}
          <Card className="w-full border border-[#B3D4FC] dark:border-[#2A3A5A] bg-[#1A2332] dark:bg-[#111827] rounded-lg px-4 py-3 mb-2 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="block text-base font-semibold text-blue-200 dark:text-blue-300">
                {insight.title || 'Insight'}
              </span>
                <button
                className="text-blue-200 dark:text-blue-300 focus:outline-none"
                onClick={() => setInsightOpen((open) => !open)}
                aria-label={insightOpen ? 'Collapse' : 'Expand'}
              >
                {insightOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
            </div>
            {insightOpen && (
              <>
                {insight.whyNow && insight.whyNow.length > 0 && (
                  <div className="mb-2">
                    <div className="font-semibold text-sm mb-1 text-blue-200 dark:text-blue-300">
                      Why Now
                    </div>
                    <div className="text-base text-blue-100 dark:text-blue-100">
                      <MarkdownRenderer content={insight.whyNow.join('\n\n')} />
                    </div>
                  </div>
                )}
                {insight.expectedOutcome && (
                  <div className="mb-2">
                    <div className="font-semibold text-sm mb-1 text-blue-200 dark:text-blue-300">
                      Expected Outcome
                    </div>
                    <div className="text-base text-blue-100 dark:text-blue-100">
                      <MarkdownRenderer content={insight.expectedOutcome} />
                    </div>
                  </div>
                )}
                {insight.actionSteps && insight.actionSteps.length > 0 && (
                  <div className="mb-2">
                    <div className="font-semibold text-sm mb-1 text-blue-200 dark:text-blue-300">
                      Action Items
                    </div>
                    <div className="text-base text-blue-100 dark:text-blue-100">
                      <MarkdownRenderer content={insight.actionSteps.map((step: string, index: number) => `${index + 1}. ${step}`).join('\n')} />
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
          {/* Action Item Card (not collapsible) */}
          {context.actionStep && (
            <Card className="w-full border border-[#B3D4FC] dark:border-[#2A3A5A] bg-[#1A2332] dark:bg-[#111827] rounded-lg px-4 py-3">
              <span className="block text-base font-semibold text-blue-200 dark:text-blue-300">
                Action Item
              </span>
              <span className="block text-base text-blue-100 dark:text-blue-100 mt-1">
                {context.actionStep}
              </span>
            </Card>
          )}
          {/* Context Toggle Card (unchanged) */}
          <Card className="w-full border border-[#B3D4FC] dark:border-[#2A3A5A] bg-[#1A2332] dark:bg-[#111827] rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="block text-base font-semibold text-blue-200 dark:text-blue-300">
                    Context
                  </span>
                {onToggleAnalysis && (
                  <button
                    onClick={() => onToggleAnalysis(!includeAnalysisInQuery)}
                    className={`flex items-center gap-1 text-sm transition-colors ${includeAnalysisInQuery ? 'text-blue-200 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'} hover:text-blue-100 dark:hover:text-blue-100`}
                    title={includeAnalysisInQuery ? "Disable insight context" : "Enable insight context"}
                  >
                    {includeAnalysisInQuery ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-blue-200 dark:text-blue-300" />
                        <span>ON</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        <span>OFF</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            <div className="text-base font-normal text-left text-blue-100 dark:text-blue-100">
                {includeAnalysisInQuery 
                  ? 'Insight included in questions'
                : 'Insight not included in questions'
                }
            </div>
          </Card>
          </div>
        </Card>
    );
  }

  // Original ContextBox logic for other content types
  const getPlatformIcon = () => {
    switch (context.platform) {
      case 'youtube':
        return <YouTubeBrandIcon href="https://youtube.com/" className="w-8 h-8" />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'gmail':
        return <Mail className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getExternalLink = () => {
    switch (context.platform) {
      case 'youtube':
        return `https://www.youtube.com/watch?v=${context.contentId}`;
      case 'instagram':
        return (context as any).permalink || `https://www.instagram.com/p/${context.contentId}`;
      case 'gmail':
        return `https://mail.google.com/mail/u/0/#search/in:anywhere+rfc822msgid:${context.contentId}`;
      default:
        return null;
    }
  };

  const externalLink = getExternalLink();

  return (
    <Card className="sticky top-0 z-10 border border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900 shadow-sm">
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Platform Icon */}
          <div className="flex-shrink-0">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              {getPlatformIcon()}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base text-blue-900 dark:text-blue-100 truncate">
                Discussing {context.platform === 'gmail' ? 'Email' : context.platform === 'youtube' ? 'Video' : context.platform === 'instagram' ? 'Post' : 'Content'}
              </h3>
              <span className="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full capitalize">
                {context.platform}
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 line-clamp-1 leading-relaxed">
              {context.title || `${context.platform} content`}
            </p>
          </div>

          {/* Remove Button */}
          {onRemove && (
            <div className="flex-shrink-0">
              <button
                onClick={onRemove}
                className="p-1.5 text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                title={`Remove ${context.platform} context`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Instagram post-like layout */}
        {context.platform === 'instagram' && (
          <div className="mt-3">
            {/* Centered, larger image */}
            {context.thumbnailUrl && (
              <div className="flex justify-center mb-3">
                <img
                  src={context.thumbnailUrl}
                  alt="Instagram content"
                  className="w-48 h-48 object-cover rounded-lg border border-[#D0ECFF] shadow-sm"
                />
              </div>
            )}
            
            {/* Caption directly under image (like Instagram) */}
            {(context as any).fullCaption && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-[#D0ECFF]">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-h-32 overflow-y-auto">
                  {(context as any).fullCaption}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Show thumbnail for non-Instagram content */}
        {context.platform !== 'instagram' && context.thumbnailUrl && (
          <div className="mb-2">
            <img
              src={context.thumbnailUrl}
              alt="Content thumbnail"
              className="w-28 h-20 object-cover rounded-lg border border-[#D0ECFF]"
            />
          </div>
        )}

        {/* Gmail-specific thread information */}
        {context.platform === 'gmail' && (
          <div className="mt-3 p-3 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-900/10 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-blue-700">
            {/* Subject as main title */}
            <div className="mb-1">
              <h4 className="text-base font-semibold text-blue-900 dark:text-blue-100 truncate">
                {
                  (() => {
                    const messages = context.content?.messages || [];
                    return (
                      messages[0]?.subject ||
                      context.content?.subject ||
                      context.title ||
                      'Gmail Thread'
                    );
                  })()
                }
              </h4>
            </div>
            {/* From as subtitle */}
            <div className="mb-1">
              <span className="text-sm text-blue-700 dark:text-blue-300">From: </span>
              <span className="text-sm text-blue-900 dark:text-blue-100">
                {
                  (() => {
                    const messages = context.content?.messages || [];
                    return (
                      messages[0]?.from ||
                      context.content?.from ||
                      'Unknown Sender'
                    );
                  })()
                }
              </span>
            </div>
            {/* Received date (from first message or createdAt) */}
            <div>
              <span className="text-sm text-blue-700 dark:text-blue-300">Received: </span>
              <span className="text-sm text-blue-900 dark:text-blue-100">
                {
                  (() => {
                    const messages = context.content?.messages || [];
                    if (messages.length > 0 && messages[0].date) {
                      const date = new Date(messages[0].date);
                      if (!isNaN(date.getTime())) return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                      return messages[0].date;
                    }
                    if (context.convexData?.createdAt) {
                      const date = new Date(context.convexData.createdAt);
                      if (!isNaN(date.getTime())) return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                    }
                    return 'Unknown';
                  })()
                }
              </span>
            </div>
          </div>
        )}

        {/* Show AI insight or analysis summary if available */}
        {context.platform === 'ai-insights' && (context as any).fullInsight ? (
          <AIInsightDisplayCard context={context as any} />
        ) : context.analysis ? (
          <div className="mt-3 p-3 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-900/10 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  {context.platform} Analysis
                </h4>
              </div>
              {onToggleAnalysis && (
                <button
                  onClick={() => onToggleAnalysis(!includeAnalysisInQuery)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all ${
                    includeAnalysisInQuery 
                      ? 'text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-800' 
                      : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                  title={includeAnalysisInQuery ? "Disable analysis context" : "Enable analysis context"}
                >
                  {includeAnalysisInQuery ? (
                    <>
                      <ToggleRight className="w-3 h-3" />
                      <span>ON</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-3 h-3" />
                      <span>OFF</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200 max-h-32 overflow-y-auto">
              <MarkdownRenderer content={processContentIfNeeded(context.analysis)} />
            </div>
          </div>
        ) : context.platform === 'youtube' && context.content ? (
          // Show video details when no analysis is available for YouTube
          <div className="mt-3 p-3 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-900/10 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Video Details
              </h4>
            </div>
            
            {/* Top row: Channel and Duration */}
            <div className="flex flex-wrap gap-4 mb-2 text-sm">
              {context.content.channelTitle && (
                <div className="flex items-center gap-1">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Channel:</span>
                  <span className="text-blue-900 dark:text-blue-100">{context.content.channelTitle}</span>
                </div>
              )}
              {context.content.duration && (
                <div className="flex items-center gap-1">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Duration:</span>
                  <span className="text-blue-900 dark:text-blue-100">{context.content.duration}</span>
                </div>
              )}
              {/* Transcript status */}
              {context.content.hasCaptions !== undefined && (
                <div className="flex items-center gap-1">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Transcript:</span>
                  <span className={`text-sm ${context.content.hasCaptions ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {context.content.hasCaptions ? '✓ Available' : '✗ Not available'}
                  </span>
                </div>
              )}
            </div>

            {/* Description (if available) */}
            {context.content.description && (
              <div className="mb-2 text-sm">
                <span className="text-blue-700 dark:text-blue-300 font-medium">Description: </span>
                <span className="text-blue-900 dark:text-blue-100">
                  {context.content.description.length > 100 
                    ? `${context.content.description.substring(0, 100)}...` 
                    : context.content.description}
                </span>
              </div>
            )}

            {/* Bottom row: Tags and Comments */}
            <div className="flex flex-wrap gap-4 mb-2 text-sm">
              {/* Tags */}
              {context.content.tags && context.content.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Tags:</span>
                  <span className="text-blue-900 dark:text-blue-100">
                    {context.content.tags.slice(0, 3).join(', ')}
                    {context.content.tags.length > 3 && ` (+${context.content.tags.length - 3} more)`}
                  </span>
                </div>
              )}
              {/* Comments */}
              {context.content.hasComments && (
                <div className="flex items-center gap-1">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Comments:</span>
                  <span className="text-blue-900 dark:text-blue-100">
                    {context.content.totalComments || context.content.comments?.length || 0} available
                  </span>
                </div>
              )}
            </div>

            {/* Metrics row */}
            {context.metrics && (
              <div className="flex gap-4 text-xs text-blue-600 dark:text-blue-400">
                {context.metrics.views > 0 && (
                  <span>{context.metrics.views.toLocaleString()} views</span>
                )}
                {context.metrics.likes > 0 && (
                  <span>{context.metrics.likes.toLocaleString()} likes</span>
                )}
                {context.metrics.comments > 0 && (
                  <span>{context.metrics.comments.toLocaleString()} comments</span>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Show external link if available - Gmail doesn't have external links so this won't show */}
        {externalLink && context.platform !== 'gmail' && (
          <div className="mt-3">
            <a
              href={externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#4E87E3] hover:text-[#3A6FBA] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on {context.platform === 'youtube' ? 'YouTube' : context.platform === 'instagram' ? 'Instagram' : context.platform === 'gmail' ? 'Gmail' : 'Platform'}
            </a>
          </div>
        )}
      </div>
    </Card>
  );
};