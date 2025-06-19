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
          setEmbeddingStatus(`✅ ~${info.count} ${config.name} items indexed`);
        }
      }
    };

    checkEmbeddings();
  }, [userId, config.name]);

  // Function to update embeddings for this platform specifically
  const handleUpdatePlatformEmbeddings = async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setEmbeddingStatus('❌ No user ID found');
      return;
    }

    setIsUpdatingEmbeddings(true);
    setEmbeddingStatus(`🚀 Updating ${config.name} embeddings...`);
    
    try {
      const results = await generateEmbeddingsForPlatform(currentUserId, platform);
      
      // Get platform-specific results from the results object
      const platformResults = results[platform];
      
      setEmbeddingStatus(`✅ Updated! ${platformResults.succeeded}/${platformResults.processed} ${config.name} items processed (${platformResults.skipped} skipped)`);
      
      // Refresh embedding info
      const info = await checkPlatformEmbeddings(currentUserId, platform);
      setEmbeddingInfo(info);
      
      if (results.errors.length > 0) {
        console.error('Embedding errors:', results.errors);
        setEmbeddingStatus(prev => prev + ` (${results.errors.length} errors)`);
      }
    } catch (error: any) {
      setEmbeddingStatus(`❌ Failed: ${error.message}`);
      console.error('Platform embedding update failed:', error);
    } finally {
      setIsUpdatingEmbeddings(false);
    }
  };

  if (contentCount === 0) {
    return null; // Don't show if no content
  }

  return (
    <div className={`${config.bgColor} border border-gray-200 rounded-lg p-4 mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`bg-gradient-to-r ${config.color} p-2 rounded-lg`}>
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className={`text-sm font-medium ${config.textColor}`}>
              AI Search Index - {config.name}
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              {embeddingInfo.hasEmbeddings 
                ? `${contentCount} total items • Smart search enabled`
                : `${contentCount} items available for indexing`
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {embeddingInfo.hasEmbeddings && (
            <CheckCircle className="w-4 h-4 text-green-500" />
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
                {embeddingInfo.hasEmbeddings ? 'Update Index' : 'Create Index'}
              </>
            )}
          </Button>
        </div>
      </div>
      
      {embeddingStatus && (
        <div className="mt-3 bg-white/60 rounded p-2">
          <p className="text-xs text-gray-700">
            {embeddingStatus}
          </p>
        </div>
      )}
    </div>
  );
} 