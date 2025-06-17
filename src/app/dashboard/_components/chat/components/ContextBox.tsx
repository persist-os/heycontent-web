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
      platformIcon = <YouTubeBrandIcon href="https://youtube.com/" className="w-5 h-29 min-w-[20px] min-h-[20px]" />;
    } else if (originalPlatform === 'instagram') {
      platformIcon = <Instagram className="w-6 h-6 text-pink-500" />;
    } else if (originalPlatform === 'gmail') {
      platformIcon = <Mail className="w-6 h-6 text-gray-600 dark:text-gray-400" />;
    } else {
      platformIcon = <Brain className="w-6 h-6 text-gray-600 dark:text-gray-400 flex-shrink-0" />;
    }
    return (
      <div className="sticky top-0 z-10">
        <Card className="border border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm">
          <div className="relative flex items-center min-h-[48px] mb-2 px-4">
            <div className="absolute left-6 p-2">
              {platformIcon}
            </div>
            
            <div className="w-full flex flex-col items-center justify-center">
              <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 text-center line-clamp-2 leading-tight px-2">
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
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
            <div className="mt-2 p-3 bg-gray-50/80 dark:bg-gray-800/60 rounded border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">
                    Context
                  </span>
                </div>
                {onToggleAnalysis && (
                  <button
                    onClick={() => onToggleAnalysis(!includeAnalysisInQuery)}
                    className={`flex items-center gap-1 text-sm transition-colors ${includeAnalysisInQuery ? 'text-violet-600 dark:text-violet-400' : 'text-gray-600 dark:text-gray-400'} hover:text-violet-600 dark:hover:text-violet-400`}
                    title={includeAnalysisInQuery ? "Disable insight context" : "Enable insight context"}
                  >
                    {includeAnalysisInQuery ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-violet-600 dark:text-violet-400" />
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
                  ? 'text-violet-700 dark:text-violet-300 bg-violet-100/50 dark:bg-violet-900/20' 
                  : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
              }`}>
                {includeAnalysisInQuery 
                  ? 'Insight included in questions'
                  : ''
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
        return <YouTubeBrandIcon href="https://youtube.com/" className="w-8 h-8" />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'gmail':
        return <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
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
    <Card className="sticky top-0 z-10 border border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm">
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Gmail Icon */}
          <div className="flex-shrink-0">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
                Discussing Email
              </h3>
              <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                Gmail
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 leading-relaxed">
              {context.title || 'Email conversation'}
            </p>
          </div>

          {/* Remove Button */}
          {onRemove && (
            <div className="flex-shrink-0">
              <button
                onClick={onRemove}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                title="Remove email context"
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
                  className="w-48 h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                />
              </div>
            )}
            
            {/* Caption directly under image (like Instagram) */}
            {(context as any).fullCaption && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
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
              className="w-28 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
            />
          </div>
        )}

        {/* Show AI insight or analysis summary if available */}
        {context.platform === 'ai-insights' && (context as any).fullInsight ? (
          <AIInsightDisplayCard context={context as any} />
        ) : context.analysis ? (
          <div className="mt-3 p-3 bg-gray-50/80 dark:bg-gray-800/60 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Email Analysis
                </h4>
              </div>
              {onToggleAnalysis && (
                <button
                  onClick={() => onToggleAnalysis(!includeAnalysisInQuery)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all ${
                    includeAnalysisInQuery 
                      ? 'text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-900/30' 
                      : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
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
            <div className="text-sm text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto">
              <MarkdownRenderer content={context.analysis} />
            </div>
          </div>
        ) : null}

        {/* Show external link if available - Gmail doesn't have external links so this won't show */}
        {externalLink && context.platform !== 'gmail' && (
          <div className="mt-3">
            <a
              href={externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
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