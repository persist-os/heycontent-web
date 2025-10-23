'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from './textarea';
import { Button } from './button';

interface ThumbRatingProps {
  /** Current rating: 1 = thumbs up, 0 = thumbs down, undefined = not rated */
  value?: 1 | 0;
  /** Callback when rating changes */
  onRate: (rating: 1 | 0, feedbackText?: string) => Promise<void> | void;
  /** Optional existing feedback text */
  feedbackText?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Custom className */
  className?: string;
  /** Show feedback textarea for thumbs down */
  allowFeedback?: boolean;
}

export function ThumbRating({
  value,
  onRate,
  feedbackText: initialFeedbackText,
  size = 'md',
  disabled = false,
  className,
  allowFeedback = true,
}: ThumbRatingProps) {
  const [isRating, setIsRating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState(initialFeedbackText || '');

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSize = sizeClasses[size];

  const handleRate = async (rating: 1 | 0) => {
    if (disabled || isRating) return;

    // If thumbs down and feedback is allowed, show feedback textarea
    if (rating === 0 && allowFeedback && !showFeedback) {
      setShowFeedback(true);
      return;
    }

    setIsRating(true);
    try {
      await onRate(rating, rating === 0 ? feedbackText : undefined);
      if (rating === 0 && showFeedback) {
        setShowFeedback(false);
      }
    } finally {
      setIsRating(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    await handleRate(0);
  };

  const handleFeedbackCancel = () => {
    setShowFeedback(false);
    setFeedbackText(initialFeedbackText || '');
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleRate(1)}
          disabled={disabled || isRating}
          className={cn(
            'transition-all duration-150 hover:scale-110',
            disabled || isRating
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer',
            value === 1 ? 'text-green-600' : 'text-gray-400 hover:text-green-500'
          )}
          aria-label="Thumbs up"
          title="Good output"
        >
          <ThumbsUp
            className={cn(iconSize, value === 1 && 'fill-current')}
          />
        </button>

        <button
          type="button"
          onClick={() => handleRate(0)}
          disabled={disabled || isRating}
          className={cn(
            'transition-all duration-150 hover:scale-110',
            disabled || isRating
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer',
            value === 0 ? 'text-red-600' : 'text-gray-400 hover:text-red-500'
          )}
          aria-label="Thumbs down"
          title="Poor output"
        >
          <ThumbsDown
            className={cn(iconSize, value === 0 && 'fill-current')}
          />
        </button>

        {value !== undefined && (
          <span className="text-xs text-muted-foreground ml-1">
            {value === 1 ? 'Helpful' : 'Not helpful'}
          </span>
        )}
      </div>

      {showFeedback && (
        <div className="flex flex-col gap-2 p-3 border rounded-md bg-muted/30">
          <label className="text-sm font-medium">
            What could be improved? (optional)
          </label>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Help us understand what went wrong..."
            className="min-h-[80px] resize-none"
            disabled={isRating}
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFeedbackCancel}
              disabled={isRating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleFeedbackSubmit}
              disabled={isRating}
            >
              {isRating ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </div>
      )}

      {value === 0 && initialFeedbackText && !showFeedback && (
        <div className="text-xs text-muted-foreground italic p-2 bg-muted/20 rounded">
          Feedback: {initialFeedbackText}
        </div>
      )}
    </div>
  );
}



