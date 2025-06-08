import { useCallback, useState } from 'react';
import { AmbientInsights } from './AmbientInsights';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function AmbientInsightsContainer({ handleSendMessage }: { handleSendMessage?: (msg: string) => void }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleInsightClick = useCallback((action: string, insight: any) => {
    // Format the entire card content as a message
    const message = `"${insight.title}"

${insight.description}${insight.action ? `\n\nAction: ${insight.action}` : ''}`;
    if (handleSendMessage) {
      handleSendMessage(message);
    } else {
      console.log('Insight clicked:', { action, insight, message });
    }
  }, [handleSendMessage]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ambient_insights', { method: 'POST' });
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={loading}
          className="gap-2"
          onClick={handleRefresh}
        >
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      <div className="bg-muted/50 p-4 rounded-lg">
        <AmbientInsights 
          key={refreshKey}
          onInsightClick={handleInsightClick}
          loading={loading}
          error={null}
        />
      </div>
    </div>
  );
}
