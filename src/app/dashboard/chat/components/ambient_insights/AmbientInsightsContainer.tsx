import { useCallback, useState } from 'react';
import { AmbientInsights } from './AmbientInsights';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function AmbientInsightsContainer({ userId, handleSendMessage, onNewChat }: { userId: string | undefined; handleSendMessage?: (msg: string, context?: any) => void; onNewChat?: () => void }) {
  const [refreshKey, setRefreshKey] = useState(0);

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


  // For simplicity, AmbientInsights manages its own loading and error states
  return (
    <div className="h-full flex flex-col">
      {/* Header with optional New Chat button */}
      {onNewChat && (
        <div className="flex-shrink-0 pt-3 pb-2">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex justify-end items-center gap-2 pr-6 pt-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors px-3 py-1.5 h-auto"
                onClick={onNewChat}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs">New</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Insights Content - Fit within available space with proper padding */}
      <div className="flex-1 flex flex-col min-h-0 pb-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-full">
          <AmbientInsights 
            key={refreshKey}
            userId={userId}
            onInsightClick={handleInsightClick}
            error={null}
          />
        </div>
      </div>
    </div>
  );
}
