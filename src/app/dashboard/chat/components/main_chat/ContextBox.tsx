import React from 'react';
import Image from 'next/image';
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
  // Move all useState calls to the top level
  const [youtubeMinimized, setYoutubeMinimized] = useState(false);
  const [instagramMinimized, setInstagramMinimized] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false); // for AI Insights
  const [actionOpen, setActionOpen] = useState(true);    // for AI Insights
  // Add more as needed for other platforms

  // Platform Content Strategy (Gmail, Instagram, YouTube)
  if (["gmail", "instagram", "youtube"].includes(context.platform)) {
    const platformIcon = context.platform === 'youtube'
      ? <YouTubeBrandIcon href="https://youtube.com/" className="w-8 h-8 min-w-[20px] min-h-[20px]" />
      : context.platform === 'instagram'
      ? <Instagram className="w-6 h-6 text-pink-500" />
      : context.platform === 'gmail'
      ? <Mail className="w-6 h-6 text-blue-500" />
      : null;
    // Use convexData if available for rich rendering
    const data = (context as any).convexData;
    if (data) {
      // YouTube rich card
      if (context.platform === 'youtube') {
        const title = typeof data.snippet?.title === 'string' ? data.snippet.title : 'Untitled Video';
        const channel = typeof data.snippet?.channel === 'string' ? data.snippet.channel : '';
        const thumbnail = data.snippet?.thumbnails?.high;
        const description = typeof data.snippet?.description === 'string' ? data.snippet.description : '';
        const metrics = data.statistics || {};
        const analysisMarkdown = typeof data.analysisMarkdown === 'string' ? data.analysisMarkdown : '';
        const actionItems = Array.isArray(data.analysis?.actionItems) ? data.analysis.actionItems : [];
        
        // Helper to format user-relevant data from analysis
        function formatUserRelevantData(data: any): string {
          let formatted = '';
          
          // Video performance metrics
          if (data.statistics) {
            formatted += '## 📊 Performance Metrics\n\n';
            if (data.statistics.views) formatted += `- **Views:** ${data.statistics.views.toLocaleString()}\n`;
            if (data.statistics.likes) formatted += `- **Likes:** ${data.statistics.likes.toLocaleString()}\n`;
            if (data.statistics.comments) formatted += `- **Comments:** ${data.statistics.comments.toLocaleString()}\n`;
            if (data.statistics.dislikes) formatted += `- **Dislikes:** ${data.statistics.dislikes.toLocaleString()}\n`;
            formatted += '\n';
          }
          
          // Content analysis
          if (data.analysis) {
            if (data.analysis.keyInsights && Array.isArray(data.analysis.keyInsights)) {
              formatted += '## 💡 Key Insights\n\n';
              data.analysis.keyInsights.forEach((insight: string, index: number) => {
                formatted += `${index + 1}. ${insight}\n`;
              });
              formatted += '\n';
            }
            
            if (data.analysis.audienceEngagement) {
              formatted += '## 👥 Audience Engagement\n\n';
              formatted += `- **Engagement Rate:** ${data.analysis.audienceEngagement}\n`;
              formatted += '\n';
            }
            
            if (data.analysis.contentQuality) {
              formatted += '## ⭐ Content Quality\n\n';
              formatted += `- **Quality Score:** ${data.analysis.contentQuality}\n`;
              formatted += '\n';
            }
          }
          
          // Action items
          if (actionItems.length > 0) {
            formatted += '## 🎯 Action Items\n\n';
            actionItems.forEach((item: string, index: number) => {
              formatted += `${index + 1}. ${item}\n`;
            });
          }
          
          return formatted || 'No analysis data available';
        }
        
        return (
          <Card className="w-full border border-[#4E87E3] bg-[#232F47] dark:bg-[#1A2332] rounded-xl px-0 py-0 mb-4">
            {/* Main Title Header */}
            <div className="flex items-center gap-3 px-6 pt-5 pb-3 border-b border-[#B3D4FC] dark:border-[#2A3A5A]">
              {platformIcon}
              <span className="text-lg font-bold text-white dark:text-white flex-1">YouTube Video</span>
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="ml-2 p-1.5 text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                  title="Close context"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2 px-4 pb-4 pt-2">
              {/* Inner Card with Video Title */}
              <Card className="w-full border border-[#B3D4FC] bg-[#1A2332] dark:bg-[#111827] rounded-lg px-4 py-3 mb-2">
                <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setYoutubeMinimized(m => !m)}>
                  <span className="block text-base font-semibold text-blue-200 dark:text-blue-300">{title}</span>
                  {youtubeMinimized ? <ChevronRight className="w-5 h-5 text-blue-200" /> : <ChevronDown className="w-5 h-5 text-blue-200" />}
                </div>
                {!youtubeMinimized && (
                  <div className="flex gap-4 mt-2">
                    {/* Thumbnail */}
                    {thumbnail && (
                      <Image src={thumbnail} alt="Video thumbnail" width={160} height={120} className="w-40 h-30 object-cover rounded border border-[#B3D4FC] flex-shrink-0" />
                    )}
                    {/* Basic Stats */}
                    <div className="flex flex-col gap-2 text-sm text-blue-100 dark:text-blue-100">
                      {channel && <div><span className="font-semibold text-blue-200">Channel:</span> {channel}</div>}
                      {metrics.views !== undefined && <div><span className="font-semibold text-blue-200">Views:</span> {metrics.views.toLocaleString()}</div>}
                      {metrics.likes !== undefined && <div><span className="font-semibold text-blue-200">Likes:</span> {metrics.likes.toLocaleString()}</div>}
                      {metrics.comments !== undefined && <div><span className="font-semibold text-blue-200">Comments:</span> {metrics.comments.toLocaleString()}</div>}
                      {metrics.dislikes !== undefined && <div><span className="font-semibold text-blue-200">Dislikes:</span> {metrics.dislikes.toLocaleString()}</div>}
                    </div>
                  </div>
                )}
                {/* Video Description */}
                {description && (
                  <div className="mt-3 text-sm text-blue-100 dark:text-blue-100">
                    <span className="font-semibold text-blue-200 dark:text-blue-300">Description: </span>
                    <div className="mt-1">
                      <MarkdownRenderer content={description} />
                    </div>
                  </div>
                )}
              </Card>
              {/* Context Toggle Card - Always at bottom */}
              <Card className="w-full border border-[#B3D4FC] bg-[#1A2332] dark:bg-[#111827] rounded-lg px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-base font-semibold text-blue-200 dark:text-blue-300">Context</span>
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
      // Instagram rich card
      if (context.platform === 'instagram') {
        const caption = typeof data.data?.caption === 'string' ? data.data.caption : '';
        const username = typeof data.data?.username === 'string' ? data.data.username : '';
        const mediaUrl = data.data?.media_url;
        const thumbnailUrl = data.data?.thumbnail_url;
        const timestamp = data.data?.timestamp;
        const metrics = data.data || {};
        const insights = data.data?.insights || {};
        const analysisMarkdown = typeof data.analysisMarkdown === 'string' ? data.analysisMarkdown : '';
        const actionItems = Array.isArray(data.analysis?.actionItems) ? data.analysis.actionItems : [];
        
        // Helper to format user-relevant data from analysis
        function formatUserRelevantData(data: any): string {
          let formatted = '';
          
          // Post performance metrics
          if (data.data) {
            formatted += '## 📊 Performance Metrics\n\n';
            if (data.data.like_count) formatted += `- **Likes:** ${data.data.like_count.toLocaleString()}\n`;
            if (data.data.comments_count) formatted += `- **Comments:** ${data.data.comments_count.toLocaleString()}\n`;
            if (data.data.shares_count) formatted += `- **Shares:** ${data.data.shares_count.toLocaleString()}\n`;
            if (data.data.saves_count) formatted += `- **Saves:** ${data.data.saves_count.toLocaleString()}\n`;
            formatted += '\n';
          }
          
          // Content analysis
          if (data.analysis) {
            if (data.analysis.keyInsights && Array.isArray(data.analysis.keyInsights)) {
              formatted += '## 💡 Key Insights\n\n';
              data.analysis.keyInsights.forEach((insight: string, index: number) => {
                formatted += `${index + 1}. ${insight}\n`;
              });
              formatted += '\n';
            }
            
            if (data.analysis.audienceEngagement) {
              formatted += '## 👥 Audience Engagement\n\n';
              formatted += `- **Engagement Rate:** ${data.analysis.audienceEngagement}\n`;
              formatted += '\n';
            }
            
            if (data.analysis.contentQuality) {
              formatted += '## ⭐ Content Quality\n\n';
              formatted += `- **Quality Score:** ${data.analysis.contentQuality}\n`;
              formatted += '\n';
            }
          }
          
          // Action items
          if (actionItems.length > 0) {
            formatted += '## 🎯 Action Items\n\n';
            actionItems.forEach((item: string, index: number) => {
              formatted += `${index + 1}. ${item}\n`;
            });
          }
          
          return formatted || 'No analysis data available';
        }
        
        return (
          <Card className="w-full border border-[#4E87E3] bg-[#232F47] dark:bg-[#1A2332] rounded-xl px-0 py-0 mb-4">
            {/* Main Title Header */}
            <div className="flex items-center gap-3 px-6 pt-5 pb-3 border-b border-[#B3D4FC] dark:border-[#2A3A5A]">
              {platformIcon}
              <span className="text-lg font-bold text-white dark:text-white flex-1">Instagram Post</span>
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="ml-2 p-1.5 text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                  title="Close context"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2 px-4 pb-4 pt-2">
              {/* Inner Card with Post Title */}
              <Card className="w-full border border-[#B3D4FC] bg-[#1A2332] dark:bg-[#111827] rounded-lg px-4 py-3 mb-2">
                <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setInstagramMinimized(m => !m)}>
                  <span className="block text-base font-semibold text-blue-200 dark:text-blue-300">{caption || `@${username}`}</span>
                  {instagramMinimized ? <ChevronRight className="w-5 h-5 text-blue-200" /> : <ChevronDown className="w-5 h-5 text-blue-200" />}
                </div>
                {!instagramMinimized && (
                  <div className="flex gap-4 mt-2">
                    {/* Thumbnail */}
                    {(mediaUrl || thumbnailUrl) && (
                      <Image 
                        src={mediaUrl || thumbnailUrl} 
                        alt="Instagram thumbnail" 
                        width={192}
                        height={192}
                        className="w-48 h-48 object-cover rounded border border-[#B3D4FC] flex-shrink-0" 
                      />
                    )}
                    {/* Basic Stats - Single Column */}
                    <div className="flex flex-col gap-2 text-sm text-blue-100 dark:text-blue-100">
                      {/* Posted Date */}
                      {timestamp && (
                        <div><span className="font-semibold text-blue-200">Posted:</span> {new Date(timestamp).toLocaleDateString()}</div>
                      )}
                      {/* Basic Stats */}
                      {metrics.like_count !== undefined && <div><span className="font-semibold text-blue-200">Likes:</span> {metrics.like_count.toLocaleString()}</div>}
                      {metrics.comments_count !== undefined && <div><span className="font-semibold text-blue-200">Comments:</span> {metrics.comments_count.toLocaleString()}</div>}
                      {/* Insights Stats */}
                      {insights.impressions !== undefined && <div><span className="font-semibold text-blue-200">Impressions:</span> {insights.impressions.toLocaleString()}</div>}
                      {insights.reach !== undefined && <div><span className="font-semibold text-blue-200">Reach:</span> {insights.reach.toLocaleString()}</div>}
                      {insights.saved !== undefined && <div><span className="font-semibold text-blue-200">Saves:</span> {insights.saved.toLocaleString()}</div>}
                      {insights.shares !== undefined && <div><span className="font-semibold text-blue-200">Shares:</span> {insights.shares.toLocaleString()}</div>}
                      {insights.views !== undefined && <div><span className="font-semibold text-blue-200">Views:</span> {insights.views.toLocaleString()}</div>}
                    </div>
                  </div>
                )}
              </Card>
              {/* Context Toggle Card - Always at bottom */}
              <Card className="w-full border border-[#B3D4FC] bg-[#1A2332] dark:bg-[#111827] rounded-lg px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-base font-semibold text-blue-200 dark:text-blue-300">Context</span>
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
    }
    // Fallback to generic card if no convexData
    return (
      <Card className="w-full border border-[#4E87E3] bg-[#2A3A5A] dark:bg-[#1A2332] rounded-xl px-0 py-0 mb-4">
        <div className="flex items-center gap-3 px-6 pt-5 pb-3 border-b border-[#B3D4FC] dark:border-[#2A3A5A]">
          {platformIcon}
          <span className="block text-lg font-bold text-white dark:text-white">
            {getContextOriginTitle(context.platform)}
          </span>
          {onRemove && (
            <button
              onClick={onRemove}
              className="ml-2 p-1.5 text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
              title="Close context"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2 px-4 pb-4 pt-2">
          <Card className="w-full border border-[#B3D4FC] dark:border-[#2A3A5A] bg-[#1A2332] dark:bg-[#111827] rounded-lg px-4 py-3 mb-2">
            <span className="block text-base font-semibold mb-2 text-blue-200 dark:text-blue-300">
              {context.title}
            </span>
            <div className="text-base text-blue-100 dark:text-blue-100">
              <MarkdownRenderer content={String(context.content)} />
            </div>
          </Card>
        </div>
      </Card>
    );
  }

  // Content Hub Insights
  if (context.platform === 'content-hub-insight' || ('type' in context && context.type === 'content-hub-insight')) {
    const platformIcon = <Sparkles className="w-6 h-6 text-[#4E87E3]" />;
    return (
      <Card className="w-full border border-[#4E87E3] bg-[#2A3A5A] dark:bg-[#1A2332] rounded-xl px-0 py-0 mb-4">
        {/* Main Title Header */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-3 border-b border-[#B3D4FC] dark:border-[#2A3A5A]">
          {platformIcon}
          <span className="block text-lg font-bold text-white dark:text-white">
            Content Hub Insights
          </span>
          {onRemove && (
            <button
              onClick={onRemove}
              className="ml-2 p-1.5 text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
              title="Close context"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
    const platformIcon = originalPlatform === 'youtube'
      ? <YouTubeBrandIcon href="https://youtube.com/" className="w-8 h-8 min-w-[20px] min-h-[20px]" />
      : originalPlatform === 'instagram'
      ? <Instagram className="w-6 h-6 text-pink-500" />
      : originalPlatform === 'gmail'
      ? <Mail className="w-6 h-6 text-blue-500" />
      : <Brain className="w-6 h-6 text-gray-600 dark:text-gray-400 flex-shrink-0" />;
    const insight = (context as any).fullInsight;
    // Use insightOpen/setInsightOpen and actionOpen/setActionOpen as before
    return (
      <Card className="w-full border border-[#4E87E3] bg-[#2A3A5A] dark:bg-[#1A2332] rounded-xl px-0 py-0 mb-4">
        {/* Main Title Header */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-3 border-b border-[#B3D4FC] dark:border-[#2A3A5A]">
              {platformIcon}
          <span className="block text-lg font-bold text-white dark:text-white">
            {getContextOriginTitle(context.platform, context.originalPlatform)}
          </span>
            {onRemove && (
              <button
                onClick={onRemove}
                className="ml-2 p-1.5 text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                title="Close context"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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
                <Image
                  src={context.thumbnailUrl}
                  alt="Instagram content"
                  width={192}
                  height={192}
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
            <Image
              src={context.thumbnailUrl}
              alt="Content thumbnail"
              width={112}
              height={80}
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