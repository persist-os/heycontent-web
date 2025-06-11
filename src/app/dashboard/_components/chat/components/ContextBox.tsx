import React from 'react';
import { Card } from '@/components/ui/card';
import { Instagram, Mail, X, ExternalLink, Brain, Sparkles, ToggleLeft, ToggleRight, Target } from 'lucide-react';
import { YouTubeBrandIcon } from '../../YoutubeBrandIcon';
import { ContentContext } from '../types';
import { MarkdownRenderer } from '../markdown-renderer';
import AIInsightDisplayCard from './AIInsightDisplayCard';

interface ContextBoxProps {
  context: ContentContext;
  onRemove?: () => void;
  includeAnalysisInQuery?: boolean;
  onToggleAnalysis?: (enabled: boolean) => void;
}

export const ContextBox: React.FC<ContextBoxProps> = ({ 
  context, 
  onRemove, 
  includeAnalysisInQuery = true,
  onToggleAnalysis 
}) => {
  // Special handling for AI insights with full insight data
  if (context.platform === 'ai-insights' && (context as any).fullInsight) {
    const originalPlatform = (context as any).originalPlatform;
    let platformIcon = null;
    if (originalPlatform === 'youtube') {
      platformIcon = <YouTubeBrandIcon href="https://youtube.com/" />;
    } else if (originalPlatform === 'instagram') {
      platformIcon = <Instagram className="w-6 h-6 text-pink-500" />;
    } else if (originalPlatform === 'gmail') {
      platformIcon = <Mail className="w-6 h-6 text-blue-500" />;
    } else {
      platformIcon = <Brain className="w-6 h-6 text-gray-600 dark:text-gray-400 flex-shrink-0" />;
    }
    return (
      <div className="sticky top-0 z-10">
        <Card className="border border-[#D0ECFF] bg-white dark:bg-gray-900 shadow-sm">
          <div className="relative flex items-center min-h-[48px] mb-2 px-4">
            <div className="absolute left-6 p-2">
              {platformIcon}
            </div>
            
            <div className="w-full flex flex-col items-center justify-center">
              <h3 className="font-semibold text-base text-[#4E87E3] dark:text-[#4E87E3] text-center line-clamp-2 leading-tight px-2">
                {context.platform === 'ai-insights' ? `AI Insight: ${context.title}` : `Discussing: ${context.title || `${context.platform} content`}`}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {context.platform === 'ai-insights'
                  ? `From ${originalPlatform ? originalPlatform.charAt(0).toUpperCase() + originalPlatform.slice(1) : 'Dashboard'}`
                  : `${context.platform}${context.contentId ? ` • Content ID: ${context.contentId}` : ''}`}
              </p>
            </div>
            
            <div className="absolute right-4">
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="text-gray-400 hover:text-[#4E87E3] dark:hover:text-[#4E87E3]"
                  title="Remove context"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <div className="p-4 pt-0">
            {/* Display the full AI insight */}
            <AIInsightDisplayCard context={context as any} showPlatformIcon={false} />

            {/* Analysis context toggle */}
            <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded border border-[#D0ECFF]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">
                    Context
                  </span>
                </div>
                {onToggleAnalysis && (
                  <button
                    onClick={() => onToggleAnalysis(!includeAnalysisInQuery)}
                    className={`flex items-center gap-1 text-sm transition-colors ${includeAnalysisInQuery ? 'text-[#4E87E3]' : 'text-gray-600 dark:text-gray-400'} hover:text-[#4E87E3]`}
                    title={includeAnalysisInQuery ? "Disable insight context" : "Enable insight context"}
                  >
                    {includeAnalysisInQuery ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-[#4E87E3]" />
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
              <div className={`mt-2 text-xs px-2 py-1 rounded ${
                includeAnalysisInQuery 
                  ? 'text-[#4E87E3] bg-[#D0ECFF]/40' 
                  : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
              }`}>
                {includeAnalysisInQuery 
                  ? 'Insight included in questions'
                  : 'Insight context disabled'
                }
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Original ContextBox logic for other content types
  const getPlatformIcon = () => {
    switch (context.platform) {
      case 'youtube':
        return <YouTubeBrandIcon href="https://youtube.com/" />;
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
      default:
        return null;
    }
  };

  const externalLink = getExternalLink();

  return (
    <Card className="sticky top-0 z-10 border border-[#D0ECFF] bg-white dark:bg-gray-900 shadow-sm">
      <div className="p-4">
        <div className="relative flex items-center mb-2">
          <div className="absolute left-2 p-2">
            {getPlatformIcon()}
          </div>
          <div className="w-full flex flex-col items-center justify-center">
            <h3 className="font-semibold text-base text-[#4E87E3] dark:text-[#4E87E3] text-center line-clamp-2 leading-tight px-2">
              {context.platform === 'ai-insights' ? `AI Insight: ${context.title}` : `Discussing: ${context.title || `${context.platform} content`}`}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {context.platform === 'ai-insights' ? `From ${(context as any).originalPlatform || 'Dashboard'}` : `${context.platform}${context.contentId ? ` • Content ID: ${context.contentId}` : ''}`}
            </p>
          </div>
          <div className="absolute right-0">
            {onRemove && (
              <button
                onClick={onRemove}
                className="text-gray-400 hover:text-[#4E87E3] dark:hover:text-[#4E87E3] flex-shrink-0"
                title="Remove context"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
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

        {/* Show AI insight or analysis summary if available */}
        {context.platform === 'ai-insights' && (context as any).fullInsight ? (
          <AIInsightDisplayCard context={context as any} />
        ) : context.analysis ? (
          <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded border border-[#D0ECFF] max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#4E87E3]" />
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                  AI Analysis Context
                </h4>
              </div>
              {onToggleAnalysis && (
                <button
                  onClick={() => onToggleAnalysis(!includeAnalysisInQuery)}
                  className={`flex items-center gap-1 text-sm transition-colors ${includeAnalysisInQuery ? 'text-[#4E87E3]' : 'text-gray-600 dark:text-gray-400'} hover:text-[#4E87E3]`}
                  title={includeAnalysisInQuery ? "Disable analysis context" : "Enable analysis context"}
                >
                  {includeAnalysisInQuery ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-[#4E87E3]" />
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
            <div className="text-base text-gray-800 dark:text-gray-200 max-h-40 overflow-y-auto">
              <MarkdownRenderer content={context.analysis} />
            </div>
            <div className={`mt-2 text-xs px-2 py-1 rounded ${
              includeAnalysisInQuery 
                ? 'text-[#4E87E3] bg-[#D0ECFF]/40' 
                : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
            }`}>
              {includeAnalysisInQuery 
                ? 'Analysis included in questions'
                : 'Analysis context disabled'
              }
            </div>
          </div>
        ) : null}

        {/* Show metrics if available */}
        {context.metrics && (
          <div className="mt-2 flex gap-4 text-sm text-[#4E87E3]">
            {context.metrics.views && (
              <span>Views: {context.metrics.views.toLocaleString()}</span>
            )}
            {context.metrics.likes && (
              <span>Likes: {context.metrics.likes.toLocaleString()}</span>
            )}
            {context.metrics.comments && (
              <span>Comments: {context.metrics.comments.toLocaleString()}</span>
            )}
          </div>
        )}

        {/* Show external link if available */}
        {externalLink && (
          <div className="mt-3">
            <a
              href={externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#4E87E3] hover:text-[#3A6FBA] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on {context.platform === 'youtube' ? 'YouTube' : context.platform === 'instagram' ? 'Instagram' : 'Platform'}
            </a>
          </div>
        )}
      </div>
    </Card>
  );
};