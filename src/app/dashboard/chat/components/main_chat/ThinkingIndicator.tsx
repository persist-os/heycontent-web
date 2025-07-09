import React, { useState, useEffect } from 'react'
import { Search, Brain, Sparkles, Database, CheckCircle } from 'lucide-react'

interface ThinkingIndicatorProps {
  searchStatus?: string;
  stage?: 'analyzing' | 'searching' | 'grading' | 'generating' | 'completed';
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ 
  searchStatus = '', 
  stage = 'generating' 
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Enhanced status messaging based on stage and searchStatus
  const getStatusInfo = () => {
    if (searchStatus) {
      if (searchStatus.includes('Analyzing whether your query needs context')) {
        return {
          icon: <Search className="w-4 h-4 text-blue-500 animate-pulse" />,
          message: 'Analyzing whether your query needs context',
          submessage: 'Determining if we need to search your content',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      }
      if (searchStatus.includes('Query needs context - proceeding with vector search')) {
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          message: 'Query needs context - proceeding with vector search',
          submessage: 'Your query would benefit from your content history',
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      }
      if (searchStatus.includes('Query needs context (heuristic) - proceeding with vector search')) {
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          message: 'Query needs context - proceeding with vector search',
          submessage: 'Using fast analysis - your query would benefit from context',
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      }
      if (searchStatus.includes('Query is self-contained - skipping vector search')) {
        return {
          icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
          message: 'Query is self-contained - skipping vector search',
          submessage: 'Your query doesn\'t need additional context',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800'
        };
      }
      if (searchStatus.includes('Query is self-contained (heuristic) - skipping vector search')) {
        return {
          icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
          message: 'Query is self-contained - skipping vector search',
          submessage: 'Fast analysis - your query doesn\'t need additional context',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800'
        };
      }
      if (searchStatus.includes('Skipping content search')) {
        return {
          icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
          message: 'Skipping content search',
          submessage: searchStatus.includes('heuristic') ? 'Fast analysis completed' : 'Query analysis completed',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800'
        };
      }
      if (searchStatus.includes('Looking through all your content')) {
        return {
          icon: <Search className="w-4 h-4 text-blue-500 animate-pulse" />,
          message: 'Looking through all your content',
          submessage: 'Scanning notes, conversations, and content',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      }
      if (searchStatus.includes('Discovered') && searchStatus.includes('potentially relevant items')) {
        return {
          icon: <Database className="w-4 h-4 text-green-500" />,
          message: 'Content search completed',
          submessage: 'Found relevant matches in your data',
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      }
      if (searchStatus.includes('Analyzing relevance across your content')) {
        return {
          icon: <Brain className="w-4 h-4 text-purple-500 animate-bounce" />,
          message: 'Analyzing relevance across your content',
          submessage: 'Using AI to determine the most relevant context',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-950/20',
          borderColor: 'border-purple-200 dark:border-purple-800'
        };
      }
      if (searchStatus.includes('highly relevant items')) {
        return {
          icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
          message: searchStatus,
          submessage: 'Context analysis complete',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800'
        };
      }
      if (searchStatus.includes('Generating your response')) {
        return {
          icon: <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />,
          message: 'Generating your response',
          submessage: 'Crafting a thoughtful answer with relevant context',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50 dark:bg-amber-950/20',
          borderColor: 'border-amber-200 dark:border-amber-800'
        };
      }
    }

    // Fallback based on stage
    switch (stage) {
      case 'analyzing':
        return {
          icon: <Search className="w-4 h-4 text-blue-500 animate-pulse" />,
          message: 'Analyzing query intent',
          submessage: 'Determining if context is needed',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      case 'searching':
        return {
          icon: <Search className="w-4 h-4 text-blue-500 animate-pulse" />,
          message: 'Searching your content',
          submessage: 'Finding relevant context',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      case 'grading':
        return {
          icon: <Brain className="w-4 h-4 text-purple-500 animate-bounce" />,
          message: 'Analyzing context relevance',
          submessage: 'Determining the most useful information',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-950/20',
          borderColor: 'border-purple-200 dark:border-purple-800'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          message: 'Response ready',
          submessage: 'Analysis complete',
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />,
          message: 'Thinking',
          submessage: 'Processing your request',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50 dark:bg-amber-950/20',
          borderColor: 'border-amber-200 dark:border-amber-800'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`inline-flex items-start gap-3 p-3 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor} max-w-sm`}>
      <div className="flex-shrink-0 mt-0.5">
        {statusInfo.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${statusInfo.color}`}>
          {statusInfo.message}{dots}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {statusInfo.submessage}
        </div>
      </div>
    </div>
  )
} 