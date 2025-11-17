import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpIconButtonProps {
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'ghost' | 'outline' | 'secondary';
}

export function HelpIconButton({ 
  onClick, 
  className, 
  size = 'sm',
  variant = 'ghost'
}: HelpIconButtonProps) {
  return (
    <Button
      variant="help-icon"
      size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
      onClick={onClick}
      className={cn(
        "group",
        className
      )}
      aria-label="Open help guide"
      title="Help"
    >
      <HelpCircle 
        className={cn(
          "text-foreground group-hover:text-black",
          size === 'sm' && "h-4 w-4",
          size === 'default' && "h-5 w-5",
          size === 'lg' && "h-6 w-6"
        )}
      />
    </Button>
  );
} 