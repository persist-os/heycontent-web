import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ArrowRight } from 'lucide-react';

interface ConnectionOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
  onConnect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  connectButtonText: string;
  dismissButtonText?: string;
}

export function ConnectionOverlay({
  isVisible,
  onDismiss,
  onConnect,
  icon,
  title,
  description,
  connectButtonText,
  dismissButtonText = "Here's a sneak peek of what's coming your way"
}: ConnectionOverlayProps) {
  if (!isVisible) return null;

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

        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          {description}
        </p>
        <Button 
          onClick={onConnect}
          className="bg-primary hover:bg-primary/90 w-full mb-4 pointer-events-auto"
        >
          {connectButtonText}
        </Button>
        <Button
          variant="outline"
          className="w-full text-xs pointer-events-auto flex items-center justify-center gap-2"
          onClick={onDismiss}
        >
          {dismissButtonText}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </Card>
    </div>
  );
} 