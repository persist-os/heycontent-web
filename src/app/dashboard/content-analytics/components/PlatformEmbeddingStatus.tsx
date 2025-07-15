import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw, Database, CheckCircle, Info } from 'lucide-react';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { generateEmbeddingsForPlatform, checkPlatformEmbeddings } from '../../chat/utils/api-utils';

interface PlatformEmbeddingStatusProps {
  platform: 'instagram' | 'youtube' | 'gmail';
  contentCount: number;
  userId?: string;
}

export function PlatformEmbeddingStatus({ platform, contentCount, userId }: PlatformEmbeddingStatusProps) {
  const [embeddingStatus, setEmbeddingStatus] = useState<string>('');
  const [isUpdatingEmbeddings, setIsUpdatingEmbeddings] = useState(false);
  const [embeddingInfo, setEmbeddingInfo] = useState<{ hasEmbeddings: boolean; count: number }>({ 
    hasEmbeddings: false, 
    count: 0 
  });

  // Platform-specific configuration
  const platformConfig = {
    instagram: {
      name: 'Instagram',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-900',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      contentType: 'instagram_post' as const
    },
    youtube: {
      name: 'YouTube',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-900',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      contentType: 'youtube_video' as const
    },
    gmail: {
      name: 'Gmail',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-900',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      contentType: 'gmail_thread' as const
    }
  };

  const config = platformConfig[platform];

  // Check for existing embeddings when component mounts
  useEffect(() => {
    const checkEmbeddings = async () => {
      const currentUserId = getCurrentUserId();
      if (currentUserId) {
        const info = await checkPlatformEmbeddings(currentUserId, platform);
        setEmbeddingInfo(info);
        
        if (info.hasEmbeddings) {
          setEmbeddingStatus(`~${info.count} ${config.name} content items remembered`);
        }
      }
    };

    checkEmbeddings();
  }, [userId, config.name]);

  // Function to update embeddings for this platform specifically
  const handleUpdatePlatformEmbeddings = async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setEmbeddingStatus('No user ID found');
      return;
    }

    setIsUpdatingEmbeddings(true);
    setEmbeddingStatus(`Learning about your ${config.name} content...`);
    
    try {
      const results = await generateEmbeddingsForPlatform(currentUserId, platform);
      
      // Get platform-specific results from the results object
      const platformResults = results[platform];
      
      setEmbeddingStatus(`Updated! ${platformResults.succeeded}/${platformResults.processed} ${config.name} items processed (${platformResults.skipped} skipped)`);
      
      // Refresh embedding info
      const info = await checkPlatformEmbeddings(currentUserId, platform);
      setEmbeddingInfo(info);
      
      if (results.errors.length > 0) {
        console.error('Embedding errors:', results.errors);
        setEmbeddingStatus(prev => prev + ` (${results.errors.length} errors)`);
      }
    } catch (error: any) {
      setEmbeddingStatus(`Failed: ${error.message}`);
      console.error('Platform embedding update failed:', error);
    } finally {
      setIsUpdatingEmbeddings(false);
    }
  };

  if (contentCount === 0) {
    return null; // Don't show if no content
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`bg-gradient-to-r ${config.color} p-2 rounded-lg`}>
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">
              Smart Content Memory - {config.name}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {embeddingInfo.hasEmbeddings 
                ? `${contentCount} total items • I can help you find and build on this content`
                : `${contentCount} items ready for me to learn`
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {embeddingInfo.hasEmbeddings && (
            <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          )}
          <Button
            onClick={handleUpdatePlatformEmbeddings}
            disabled={isUpdatingEmbeddings}
            size="sm"
            className={`${config.buttonColor} text-white text-xs px-3 py-1`}
          >
            {isUpdatingEmbeddings ? (
              <>
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-1" />
                {embeddingInfo.hasEmbeddings ? 'Update My Content' : 'Learn My Content'}
              </>
            )}
          </Button>
        </div>
      </div>
      
      {embeddingStatus && (
        <div className="mt-3 bg-white/60 dark:bg-slate-700/50 rounded p-2 border border-slate-200/50 dark:border-slate-600/50">
          <p className="text-xs text-slate-700 dark:text-slate-300">
            {embeddingStatus}
          </p>
        </div>
      )}
    </div>
  );
} 