import { useCallback, useState } from 'react';
import { AmbientInsights } from './AmbientInsights';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus } from 'lucide-react';
import { getApiKey } from '@/app/lib/api-helpers';

export function AmbientInsightsContainer({ userId, handleSendMessage, onNewChat }: { userId: string | undefined; handleSendMessage?: (msg: string, context?: any) => void; onNewChat?: () => void }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleInsightClick = useCallback((action: string, insight: any) => {
    // Map AmbientInsight to ContentContext
    const contentContext = {
      platform: 'ambient-insight',
      contentId: insight.id,
      title: insight.title,
      analysis: insight.description,
      actionStep: insight.action,
      source: 'ambient-insight',
    };
    // Format the message for the first chat message
    const message = `"${insight.title}"
\n${insight.description}${insight.action ? `\n\nAction: ${insight.action}` : ''}`;
    if (handleSendMessage) {
      // Pass both message and context (if handleSendMessage supports context)
      handleSendMessage(message, contentContext);
    } else {
      console.log('Insight clicked:', { action, insight, message, contentContext });
    }
  }, [handleSendMessage]);

  const handleRefresh = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) throw new Error('No API key found. Please log in again.');
      
      // First, remove existing insights to force regeneration
      const removeRes = await fetch('/api/ambient_insights/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ userId }),
      });
      
      // Then generate new insights
      const res = await fetch('/api/ambient_insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          context_type: 'manual_refresh',
          content: JSON.stringify({ user_id: userId })
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to refresh ambient insights');
      }
      // Optionally handle response
    } catch (err) {
      console.error('Error refreshing ambient insights:', err);
    } finally {
      setLoading(false);
      setRefreshKey((k) => k + 1); // Force re-render/refetch
    }
  };

  // For simplicity, AmbientInsights manages its own loading and error states
  return (
    <div className="h-full flex flex-col">
      {/* Compact Header with Just Refresh Button */}
      <div className="flex-shrink-0 pt-3 pb-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Action Buttons - Compact and Right-aligned */}
          <div className="flex justify-end items-center gap-2">
            {onNewChat && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors px-3 py-1.5 h-auto"
                onClick={onNewChat}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs">New</span>
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={loading}
              className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors px-3 py-1.5 h-auto"
              onClick={handleRefresh}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-xs">
                {loading ? 'Refreshing...' : 'Refresh'}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Insights Content - Fit within available space with proper padding */}
      <div className="flex-1 flex flex-col min-h-0 pb-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-full">
          <AmbientInsights 
            key={refreshKey}
            userId={userId}
            onInsightClick={handleInsightClick}
            loading={loading}
            error={null}
          />
        </div>
      </div>
    </div>
  );
}
