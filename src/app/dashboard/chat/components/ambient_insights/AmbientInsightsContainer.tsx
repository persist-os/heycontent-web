import { useCallback, useState } from 'react';
import { AmbientInsights } from './AmbientInsights';
import { Button } from '@/components/ui/button';
import { FlexContainer, CenterContainer, ContentWrapper, FullHeightContainer } from '@/components/ui/layout';
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


  // Standardized layout using design system components
  return (
    <FullHeightContainer>
      {/* Header with optional New Chat button */}
      {onNewChat && (
        <div className="flex-shrink-0 pt-3 pb-2">
          <ContentWrapper>
            <FlexContainer direction="row" justify="end" className="pr-6 pt-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors px-3 py-1.5 h-auto"
                onClick={onNewChat}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs">New</span>
              </Button>
            </FlexContainer>
          </ContentWrapper>
        </div>
      )}

      {/* Insights Content - Centered using standardized components */}
      <CenterContainer variant="content" className="flex-1">
        <AmbientInsights 
          key={refreshKey}
          userId={userId}
          onInsightClick={handleInsightClick}
          error={null}
        />
      </CenterContainer>
    </FullHeightContainer>
  );
}
