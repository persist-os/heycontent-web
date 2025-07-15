import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw, Trash2, Database, CheckCircle, Info, Clock, Settings } from 'lucide-react';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { generateEmbeddingsForUser, checkUserEmbeddings, deleteAllUserEmbeddings } from '../../../dashboard/chat/utils/api-utils';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

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
  const [lastManualUpdate, setLastManualUpdate] = useState<number | null>(null);
  const [timeUntilNextUpdate, setTimeUntilNextUpdate] = useState<string>('');

  const currentUserId = getCurrentUserId();
  
  // Get the last embedding update time
  const lastUpdateTime = useQuery(
    api.vectorSearch.getLastEmbeddingUpdate,
    currentUserId ? { userId: currentUserId } : 'skip'
  );

  // Get recent embedding updates for more context
  const recentUpdates = useQuery(
    api.vectorSearch.getRecentEmbeddingUpdates,
    currentUserId ? { userId: currentUserId, limit: 5 } : 'skip'
  );

  // Check for existing embeddings when component mounts or user changes
  useEffect(() => {
    const checkEmbeddings = async () => {
      const currentUserId = getCurrentUserId();
      if (currentUserId) {
        const info = await checkUserEmbeddings(currentUserId);
        setEmbeddingInfo(info);
        if (info.hasEmbeddings) {
          setEmbeddingStatus(`Found ${info.count} saved content items`);
        }
      }
    };

    checkEmbeddings();
  }, [userId]);

  // Load last manual update time from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lastManualEmbeddingUpdate');
    if (saved) {
      setLastManualUpdate(parseInt(saved));
    }
  }, []);

  // Calculate time until next update is available
  useEffect(() => {
    if (lastManualUpdate) {
      const updateTimer = setInterval(() => {
        const now = Date.now();
        const timeSinceUpdate = now - lastManualUpdate;
        const hoursRemaining = 24 - (timeSinceUpdate / (1000 * 60 * 60));
        
        if (hoursRemaining <= 0) {
          setTimeUntilNextUpdate('');
        } else {
          const hours = Math.floor(hoursRemaining);
          const minutes = Math.floor((hoursRemaining - hours) * 60);
          setTimeUntilNextUpdate(`${hours}h ${minutes}m`);
        }
      }, 1000);

      return () => clearInterval(updateTimer);
    }
  }, [lastManualUpdate]);

  // Function to generate embeddings for user content
  const handleGenerateEmbeddings = async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setEmbeddingStatus('No user ID found');
      return;
    }

    // Check if 24 hours have passed since last manual update
    if (lastManualUpdate && Date.now() - lastManualUpdate < 24 * 60 * 60 * 1000) {
      setEmbeddingStatus('Manual refresh available in ' + timeUntilNextUpdate);
      return;
    }

    setIsGeneratingEmbeddings(true);
    setEmbeddingStatus('Learning about your content...');
    
    try {
      const results = await generateEmbeddingsForUser(currentUserId);
      
      const convStats = `Conversations: ${results.conversations.succeeded}/${results.conversations.processed} (${results.conversations.skipped} skipped)`;
      const noteStats = `Notes: ${results.notes.succeeded}/${results.notes.processed} (${results.notes.skipped} skipped)`;
      const instagramStats = `Instagram: ${results.instagramPosts.succeeded}/${results.instagramPosts.processed} (${results.instagramPosts.skipped} skipped)`;
      const youtubeStats = `YouTube: ${results.youtubeVideos.succeeded}/${results.youtubeVideos.processed} (${results.youtubeVideos.skipped} skipped)`;
      const gmailStats = `Gmail: ${results.gmailThreads.succeeded}/${results.gmailThreads.processed} (${results.gmailThreads.skipped} skipped)`;
      
      setEmbeddingStatus(`Complete! ${convStats}, ${noteStats}, ${instagramStats}, ${youtubeStats}, ${gmailStats}`);
      
      // Update last manual update time
      const now = Date.now();
      setLastManualUpdate(now);
      localStorage.setItem('lastManualEmbeddingUpdate', now.toString());
      
      // Refresh embedding info
      const info = await checkUserEmbeddings(currentUserId);
      setEmbeddingInfo(info);
      
      if (results.errors.length > 0) {
        console.error('Embedding errors:', results.errors);
        setEmbeddingStatus(prev => prev + ` (${results.errors.length} errors - check console)`);
      }
    } catch (error: any) {
      setEmbeddingStatus('Something went wrong while learning your content');
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  // Function to delete all embeddings
  const handleDeleteEmbeddings = async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setEmbeddingStatus('No user ID found');
      return;
    }

    if (!confirm(`Are you sure you want to clear all ${embeddingInfo.count} saved content items? I'll forget everything I learned about your content.`)) {
      return;
    }

    setIsDeletingEmbeddings(true);
    setEmbeddingStatus('Clearing saved content...');
    
    try {
      const result = await deleteAllUserEmbeddings(currentUserId);
      
      if (result.success) {
        setEmbeddingStatus(`Cleared ${result.deletedCount} content items`);
        
        // Refresh embedding info
        const info = await checkUserEmbeddings(currentUserId);
        setEmbeddingInfo(info);
      } else {
        setEmbeddingStatus(`Failed: ${result.message}`);
      }
    } catch (error: any) {
      setEmbeddingStatus(`Failed: ${error.message}`);
      console.error('Embedding deletion failed:', error);
    } finally {
      setIsDeletingEmbeddings(false);
    }
  };

  // Format the last update time
  const formatLastUpdate = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString();
  };

  // Check if manual refresh is available
  const isManualRefreshAvailable = !lastManualUpdate || (Date.now() - lastManualUpdate >= 24 * 60 * 60 * 1000);

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
          <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Smart Content Memory</h3>
          <p className="text-sm text-muted-foreground">
            Automatically learns and remembers your content across all platforms
          </p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-foreground">
            <p className="font-medium mb-1">How it helps you:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Remembers your content from Instagram, YouTube, emails, chats, and notes</li>
              <li>• Learns what you create so I can give you better suggestions</li>
              <li>• Find your old content by describing what you're looking for</li>
              <li>• Get personalized ideas based on what you've created before</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-700/50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-full">
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {embeddingInfo.hasEmbeddings 
                ? `${embeddingInfo.count} pieces of content remembered`
                : 'No content saved yet'
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {embeddingInfo.hasEmbeddings 
                ? 'I can now help you find and build on your past work'
                : 'Let me learn about your content to help you better'
              }
            </p>
          </div>
        </div>
        {embeddingInfo.hasEmbeddings && (
          <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
        )}
      </div>

      {/* Last Update Time */}
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200/50 dark:border-slate-700/50">
        <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <div className="text-sm">
          <span className="text-slate-600 dark:text-slate-400">Last saved to memory: </span>
          {lastUpdateTime ? (
            <>
              <span className="font-medium text-foreground">{formatLastUpdate(lastUpdateTime)}</span>
              {recentUpdates && recentUpdates.length > 0 && (
                <>
                  <span className="text-slate-500 dark:text-slate-400 mx-1">•</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {recentUpdates[0].type === 'content_update' && 'Content updated'}
                    {recentUpdates[0].type === 'platform_connection' && 'Platform connected'}
                    {recentUpdates[0].type === 'automatic_update' && 'Automatic refresh'}
                    {recentUpdates[0].type === 'manual_update' && 'Manual refresh'}
                    {recentUpdates[0].platform && ` (${recentUpdates[0].platform})`}
                    {recentUpdates[0].contentType && ` - ${recentUpdates[0].contentType}`}
                    {recentUpdates[0].itemsProcessed && recentUpdates[0].itemsProcessed > 0 && (
                      <span className="text-slate-500"> • {recentUpdates[0].itemsSucceeded}/{recentUpdates[0].itemsProcessed} items</span>
                    )}
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">
              {lastUpdateTime === null ? 'Never' : 'Loading...'}
              {recentUpdates === undefined && ' (Query loading...)'}
              {recentUpdates && recentUpdates.length === 0 && ' (No content saved yet)'}
            </span>
          )}
        </div>
      </div>

      {/* Manual Controls */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200/50 dark:border-amber-700/50">
        <div className="flex items-start gap-3 mb-3">
          <div className="bg-amber-100 dark:bg-amber-800/50 p-2 rounded-full">
            <Settings className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">Manual Controls</p>
            <p className="text-amber-700 dark:text-amber-300">
              {isManualRefreshAvailable 
                ? 'Manually refresh or clear your content memory. This is usually not needed since the system works automatically.'
                : `Manual refresh available in ${timeUntilNextUpdate}`
              }
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {embeddingInfo.hasEmbeddings ? (
            <>
              <Button
                onClick={handleGenerateEmbeddings}
                disabled={isGeneratingEmbeddings || !isManualRefreshAvailable}
                className="flex-1 bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 text-white disabled:opacity-50"
              >
                {isGeneratingEmbeddings ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Learning New Content...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Content Memory
                  </>
                )}
              </Button>
              <Button
                onClick={handleDeleteEmbeddings}
                disabled={isDeletingEmbeddings || isGeneratingEmbeddings}
                variant="outline"
                className="flex-1 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {isDeletingEmbeddings ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Memory
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleGenerateEmbeddings}
              disabled={isGeneratingEmbeddings || !isManualRefreshAvailable}
              className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 text-white disabled:opacity-50"
            >
              {isGeneratingEmbeddings ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Memory...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Create Content Memory
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {embeddingStatus && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200/50 dark:border-slate-700/50">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
            {embeddingStatus}
          </p>
        </div>
      )}
    </div>
  );
} 