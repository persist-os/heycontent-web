import React from 'react';
import { Card } from './card';
import { AutoScalingText } from './auto-scaling-text';
import { cn } from '@/lib/utils';
import { T } from '@/components/translation';

interface InsightCardProps {
  title: string;
  description: string;
  recommendation?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
  maxFontSize?: number;
  minFontSize?: number;
  responsive?: boolean;
  titleSize?: string; // Custom title size class override
}

/**
 * InsightCard - A reusable card component for displaying insights
 * 
 * Features:
 * - Auto-scaling text that adapts to fit the card
 * - Configurable layout variants
 * - Hover states and animations
 * - Accessibility support
 * - Icon support with proper positioning
 */
export const InsightCard: React.FC<InsightCardProps> = ({
  title,
  description,
  recommendation,
  icon,
  onClick,
  className,
  variant = 'default',
  maxFontSize,
  minFontSize,
  responsive = true,
  titleSize
}) => {
  const isClickable = !!onClick;
  const height = variant === 'compact' ? 'h-48' : 'h-64 sm:h-72 lg:h-80';

  return (
    <Card
      className={cn(
        'group flex flex-col transition-all duration-300 ease-out',
        height,
        'bg-card/40 border-border/50 hover:border-border',
        isClickable && [
          'cursor-pointer hover:bg-card/60 hover:shadow-lg',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
        ],
        className
      )}
      onClick={onClick}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-label={isClickable ? `${title}: ${description}` : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      <div className="p-4 sm:p-6 flex flex-col h-full">
        {/* Title */}
        <h3 className={cn(
          'font-medium text-foreground group-hover:text-primary leading-tight transition-colors duration-300 line-clamp-2 flex-shrink-0',
          titleSize || (variant === 'compact' ? 'text-lg mb-3' : 'text-lg sm:text-xl lg:text-2xl mb-4')
        )}>
          <T context="insight.title">{title}</T>
        </h3>
        
        {/* Description with auto-scaling text */}
        <div className="flex-1 min-h-0 mb-2 overflow-auto">
          <AutoScalingText 
            text={description}
            maxFontSize={maxFontSize || (variant === 'compact' ? 22 : 24)}
            minFontSize={minFontSize || (variant === 'compact' ? 18 : 20)}
            responsive={responsive}
            enableTranslation={true}
            context="insight.description"
          />
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div className="flex-shrink-0 mb-2">
            <p className="text-sm sm:text-base font-medium text-primary/90">
              <T context="insight.recommendation">{recommendation}</T>
            </p>
          </div>
        )}

        {/* Icon */}
        {icon && (
          <div className="flex justify-end flex-shrink-0 h-6">
            <div className="text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-300">
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default InsightCard;
