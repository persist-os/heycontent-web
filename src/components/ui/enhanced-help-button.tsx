import React from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedHelpButtonProps {
  onInteractiveTour: () => void; // Interactive tour handler
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'ghost' | 'outline' | 'secondary';
}

export function EnhancedHelpButton({ 
  onInteractiveTour,
  className, 
  size = 'sm',
  variant = 'ghost'
}: EnhancedHelpButtonProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onInteractiveTour}
      className={cn(
        "group relative gap-2 text-muted-foreground transition-all duration-200 border border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
        size === 'sm' && "h-8 px-3",
        size === 'default' && "h-10 px-4",
        size === 'lg' && "h-12 px-5",
        className
      )}
      aria-label="Start interactive tour"
      title="Interactive Tour"
    >
      <div className="p-1 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <Play className="h-3 w-3" />
      </div>
      <span className="font-medium">Interactive Tour</span>
      
      {/* Subtle indicator for interactive features */}
      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
    </Button>
  );
} 