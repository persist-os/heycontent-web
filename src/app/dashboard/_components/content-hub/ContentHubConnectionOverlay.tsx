import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, Sparkles, Link } from 'lucide-react';

interface ContentHubConnectionOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
  onConnect: () => void;
  connectedPlatforms: string[];
}

export function ContentHubConnectionOverlay({
  isVisible,
  onDismiss,
  onConnect,
  connectedPlatforms
}: ContentHubConnectionOverlayProps) {
  if (!isVisible) return null;

  const connectedCount = connectedPlatforms.length;
  const needsMore = connectedCount < 2;

  return (
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
      <Card className="p-8 text-center max-w-md mx-auto shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
        {/* Dismiss Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-muted pointer-events-auto"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-white" />
        </div>

        <h2 className="text-xl font-semibold mb-3">
          {needsMore ? 'Preview Mode' : 'Connect More Platforms'}
        </h2>
        
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
          {needsMore 
            ? `You're seeing a preview with sample data. Connect at least 2 platforms to unlock real cross-platform insights based on your actual content.`
            : `You have ${connectedCount} platform${connectedCount === 1 ? '' : 's'} connected. Add more platforms to get richer cross-platform remix opportunities!`
          }
        </p>

        {connectedCount > 0 && (
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-2">Connected:</p>
            <div className="flex justify-center gap-2">
              {connectedPlatforms.map(platform => (
                <span 
                  key={platform}
                  className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full capitalize"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <Button 
          onClick={onConnect}
          className="bg-primary hover:bg-primary/90 w-full mb-4 pointer-events-auto"
        >
          <Link className="w-4 h-4 mr-2" />
          {needsMore ? 'Connect Platforms' : 'Add More Platforms'}
        </Button>
        
        <Button
          variant="outline"
          className="w-full text-xs pointer-events-auto flex items-center justify-center gap-2"
          onClick={onDismiss}
        >
          Continue exploring preview
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </Card>
    </div>
  );
} 