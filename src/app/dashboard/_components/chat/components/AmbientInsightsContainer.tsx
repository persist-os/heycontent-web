import { useCallback } from 'react';
import { AmbientInsights } from './AmbientInsights';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function AmbientInsightsContainer() {
  const handleInsightClick = useCallback((action: string, insight: any) => {
    console.log('Insight clicked:', { action, insight });
  }, []);

  // For simplicity, AmbientInsights manages its own loading and error states
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Ambient Insights</h2>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={false} // You can add refresh logic if needed
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      <div className="bg-muted/50 p-4 rounded-lg">
        <AmbientInsights 
          onInsightClick={handleInsightClick}
          loading={false}
          error={null}
        />
      </div>
    </div>
  );
}
