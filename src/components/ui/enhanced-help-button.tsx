import React from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { T } from '@/components/translation';
import { useLanguagePreference, useTranslation } from '@/hooks/useTranslation';

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
  const { language } = useLanguagePreference();
  
  const { text: tourText } = useTranslation('Interactive Tour', {
    context: 'button.interactive_tour',
    targetLang: language,
    enabled: true,
  });
  
  return (
    <Button
      variant="enhanced-help"
      size={size}
      onClick={onInteractiveTour}
      className={cn(
        "group relative gap-2",
        className
      )}
      aria-label="Start interactive tour"
      title={tourText}
    >
      <div className="p-1 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <Play className="h-3 w-3" />
      </div>
      <span className="font-medium">{tourText}</span>
      
      {/* Subtle indicator for interactive features */}
      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
    </Button>
  );
} 