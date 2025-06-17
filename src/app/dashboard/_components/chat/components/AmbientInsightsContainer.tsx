import { useCallback, useState } from 'react';
import { AmbientInsights } from './AmbientInsights';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { getApiKey } from '@/app/lib/api-helpers';

export function AmbientInsightsContainer({ handleSendMessage }: { handleSendMessage?: (msg: string, context?: any) => void }) {
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
    setLoading(true);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) throw new Error('No API key found. Please log in again.');
      const res = await fetch('/api/ambient_insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({}), // Send an empty object or required payload
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
    <div className="h-full flex flex-col px-3 sm:px-4 lg:px-6 overflow-hidden">
      {/* Compact Header with Just Refresh Button */}
      <div className="flex-shrink-0 pt-4 pb-3">
        <div className="max-w-4xl sm:max-w-5xl lg:max-w-7xl mx-auto">
          {/* Refresh Button - Compact and Right-aligned */}
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={loading}
              className="gap-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50/50 transition-colors px-3 py-1.5 h-auto"
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

      {/* Insights Content - Full Available Space */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4 min-h-0">
        <div className="max-w-4xl sm:max-w-5xl lg:max-w-7xl mx-auto">
          <AmbientInsights 
            key={refreshKey}
            onInsightClick={handleInsightClick}
            loading={loading}
            error={null}
          />
        </div>
      </div>
    </div>
  );
}
