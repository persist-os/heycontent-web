import React from 'react';
import { Card } from '@/components/ui/card';
import { Youtube, Instagram, Mail, X, ExternalLink, Brain, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';
import { ContentContext } from '../types';
import { MarkdownRenderer } from '../markdown-renderer';

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
  const getPlatformIcon = () => {
    switch (context.platform) {
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-500" />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'gmail':
        return <Mail className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getPlatformColor = () => {
    switch (context.platform) {
      case 'youtube':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'instagram':
        return 'border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-950';
      case 'gmail':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
    }
  };

  const getExternalLink = () => {
    switch (context.platform) {
      case 'youtube':
        return `https://www.youtube.com/watch?v=${context.contentId}`;
      case 'instagram':
        return `https://www.instagram.com/p/${context.contentId}`;
      default:
        return null;
    }
  };

  const externalLink = getExternalLink();

  return (
    <Card className={`sticky top-0 z-10 border-2 ${getPlatformColor()} shadow-sm`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {getPlatformIcon()}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Discussing: {context.title || `${context.platform} content`}
                </h3>
                {context.analysis && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <Brain className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">AI Analysis Available</span>
                  </div>
                )}
                {externalLink && (
                  <a
                    href={externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="View original content"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {context.platform} • Content ID: {context.contentId}
              </p>
            </div>
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              title="Remove context"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Show thumbnail if available */}
        {context.thumbnailUrl && (
          <div className="mb-3">
            <img
              src={context.thumbnailUrl}
              alt="Content thumbnail"
              className="w-24 h-16 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Show analysis summary if available */}
        {context.analysis && (
          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  AI Analysis Context
                </h4>
              </div>
              {onToggleAnalysis && (
                <button
                  onClick={() => onToggleAnalysis(!includeAnalysisInQuery)}
                  className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                  title={includeAnalysisInQuery ? "Disable analysis context" : "Enable analysis context"}
                >
                  {includeAnalysisInQuery ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>Context ON</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>Context OFF</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto">
              <MarkdownRenderer content={context.analysis.substring(0, 500) + (context.analysis.length > 500 ? '...' : '')} />
            </div>
            <div className={`mt-2 text-xs px-2 py-1 rounded ${
              includeAnalysisInQuery 
                ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30'
                : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800'
            }`}>
              {includeAnalysisInQuery 
                ? '💡 This analysis will be included as context in your questions'
                : '⚠️ Analysis context is disabled - questions will not include this analysis'
              }
            </div>
          </div>
        )}

        {/* Show metrics if available */}
        {context.metrics && (
          <div className="mt-3 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
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
      </div>
    </Card>
  );
}; 