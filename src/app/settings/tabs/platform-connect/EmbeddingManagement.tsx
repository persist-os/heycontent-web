import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw, Trash2, Database, CheckCircle, Info } from 'lucide-react';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { generateEmbeddingsForUser, checkUserEmbeddings, deleteAllUserEmbeddings } from '../../../dashboard/chat/utils/api-utils';

interface EmbeddingManagementProps {
  userId?: string;
}

export function EmbeddingManagement({ userId }: EmbeddingManagementProps) {
  const [embeddingStatus, setEmbeddingStatus] = useState<string>('');
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [isDeletingEmbeddings, setIsDeletingEmbeddings] = useState(false);
  const [embeddingInfo, setEmbeddingInfo] = useState<{ hasEmbeddings: boolean; count: number }>({ 
    hasEmbeddings: false, 
    count: 0 
  });

  // Check for existing embeddings when component mounts or user changes
  useEffect(() => {
    const checkEmbeddings = async () => {
      const currentUserId = getCurrentUserId();
      if (currentUserId) {
        const info = await checkUserEmbeddings(currentUserId);
        setEmbeddingInfo(info);
        if (info.hasEmbeddings) {
          setEmbeddingStatus(`✅ Found ${info.count} existing embeddings`);
        }
      }
    };

    checkEmbeddings();
  }, [userId]);

  // Function to generate embeddings for user content
  const handleGenerateEmbeddings = async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setEmbeddingStatus('❌ No user ID found');
      return;
    }

    setIsGeneratingEmbeddings(true);
    setEmbeddingStatus('🚀 Starting embedding generation...');
    
    try {
      const results = await generateEmbeddingsForUser(currentUserId);
      
      const convStats = `Conversations: ${results.conversations.succeeded}/${results.conversations.processed} (${results.conversations.skipped} skipped)`;
      const noteStats = `Notes: ${results.notes.succeeded}/${results.notes.processed} (${results.notes.skipped} skipped)`;
      const instagramStats = `Instagram: ${results.instagramPosts.succeeded}/${results.instagramPosts.processed} (${results.instagramPosts.skipped} skipped)`;
      const youtubeStats = `YouTube: ${results.youtubeVideos.succeeded}/${results.youtubeVideos.processed} (${results.youtubeVideos.skipped} skipped)`;
      const gmailStats = `Gmail: ${results.gmailThreads.succeeded}/${results.gmailThreads.processed} (${results.gmailThreads.skipped} skipped)`;
      
      setEmbeddingStatus(`✅ Complete! ${convStats}, ${noteStats}, ${instagramStats}, ${youtubeStats}, ${gmailStats}`);
      
      // Refresh embedding info
      const info = await checkUserEmbeddings(currentUserId);
      setEmbeddingInfo(info);
      
      if (results.errors.length > 0) {
        console.error('Embedding errors:', results.errors);
        setEmbeddingStatus(prev => prev + ` (${results.errors.length} errors - check console)`);
      }
    } catch (error: any) {
      setEmbeddingStatus(`❌ Failed: ${error.message}`);
      console.error('Embedding generation failed:', error);
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  // Function to delete all embeddings
  const handleDeleteEmbeddings = async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setEmbeddingStatus('❌ No user ID found');
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${embeddingInfo.count} embeddings? This action cannot be undone.`)) {
      return;
    }

    setIsDeletingEmbeddings(true);
    setEmbeddingStatus('🗑️ Deleting embeddings...');
    
    try {
      const result = await deleteAllUserEmbeddings(currentUserId);
      
      if (result.success) {
        setEmbeddingStatus(`✅ Deleted ${result.deletedCount} embeddings`);
        
        // Refresh embedding info
        const info = await checkUserEmbeddings(currentUserId);
        setEmbeddingInfo(info);
      } else {
        setEmbeddingStatus(`❌ ${result.message}`);
      }
    } catch (error: any) {
      setEmbeddingStatus(`❌ Failed: ${error.message}`);
      console.error('Embedding deletion failed:', error);
    } finally {
      setIsDeletingEmbeddings(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-purple-100 p-2 rounded-lg">
          <Brain className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Search Intelligence</h3>
          <p className="text-sm text-gray-600">
            Enable smart content discovery across all your platforms
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="space-y-1 text-gray-600">
              <li>• Analyzes your content from Instagram, YouTube, Gmail, conversations, and notes</li>
              <li>• Creates AI-powered search indexes for intelligent content discovery</li>
              <li>• Enables semantic search - find content by meaning, not just keywords</li>
              <li>• Powers personalized insights and recommendations in chat</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-blue-50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">
              {embeddingInfo.hasEmbeddings 
                ? `${embeddingInfo.count} content items indexed`
                : 'No content indexed yet'
              }
            </p>
            <p className="text-xs text-blue-700">
              {embeddingInfo.hasEmbeddings 
                ? 'Your content is ready for AI-powered search'
                : 'Index your content to enable smart search'
              }
            </p>
          </div>
        </div>
        {embeddingInfo.hasEmbeddings && (
          <CheckCircle className="w-5 h-5 text-green-500" />
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {embeddingInfo.hasEmbeddings ? (
          <>
            <Button
              onClick={handleGenerateEmbeddings}
              disabled={isGeneratingEmbeddings}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isGeneratingEmbeddings ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating Index...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Update Index
                </>
              )}
            </Button>
            <Button
              onClick={handleDeleteEmbeddings}
              disabled={isDeletingEmbeddings || isGeneratingEmbeddings}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              {isDeletingEmbeddings ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </>
              )}
            </Button>
          </>
        ) : (
          <Button
            onClick={handleGenerateEmbeddings}
            disabled={isGeneratingEmbeddings}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isGeneratingEmbeddings ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Creating Index...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Create AI Search Index
              </>
            )}
          </Button>
        )}
      </div>

      {embeddingStatus && (
        <div className="bg-gray-100 rounded-lg p-3">
          <p className="text-xs text-gray-700 font-mono">
            {embeddingStatus}
          </p>
        </div>
      )}
    </div>
  );
} 