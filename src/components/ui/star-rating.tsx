'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from './textarea';
import { Button } from './button';
import { T } from '@/components/translation/T';
import { useTranslation } from '@/hooks/useTranslation';

interface StarRatingProps {
  /** Current rating: 1-5, undefined = not rated */
  value?: number;
  /** Callback when rating changes */
  onRate: (rating: number, feedbackText?: string) => Promise<void> | void;
  /** Optional existing feedback text */
  feedbackText?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Custom className */
  className?: string;
  /** Show feedback textarea after rating */
  allowFeedbackText?: boolean;
}

export function StarRating({
  value,
  onRate,
  feedbackText: initialFeedbackText,
  size = 'sm',
  disabled = false,
  className,
  allowFeedbackText = true,
}: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isRating, setIsRating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState(initialFeedbackText || '');
  const [tempRating, setTempRating] = useState<number | null>(null);

  // Translated strings
  const { text: feedbackLabel } = useTranslation('Additional feedback (optional)', {
    context: 'rating.feedback.label'
  })
  const { text: feedbackPlaceholder } = useTranslation('Tell us more about your experience...', {
    context: 'rating.feedback.placeholder'
  })
  const { text: submittingText } = useTranslation('Submitting...', {
    context: 'rating.submitting'
  })
  const { text: submitRatingText } = useTranslation('Submit Rating', {
    context: 'rating.submit'
  })

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSize = sizeClasses[size];
  const displayRating = hoveredStar ?? tempRating ?? value ?? 0;

  const handleStarClick = async (rating: number) => {
    if (disabled || isRating) return;

    // If feedback text is allowed, always show feedback form
    if (allowFeedbackText && !showFeedback) {
      setTempRating(rating);
      setShowFeedback(true);
      return;
    }

    // Otherwise, submit immediately
    setIsRating(true);
    try {
      await onRate(rating, feedbackText);
    } finally {
      setIsRating(false);
      setHoveredStar(null);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!tempRating) return;
    
    setIsRating(true);
    try {
      await onRate(tempRating, feedbackText);
      setShowFeedback(false);
      setTempRating(null);
    } finally {
      setIsRating(false);
    }
  };

  const handleFeedbackCancel = () => {
    setShowFeedback(false);
    setFeedbackText(initialFeedbackText || '');
    setTempRating(null);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => !disabled && !isRating && setHoveredStar(star)}
            onMouseLeave={() => !disabled && !isRating && setHoveredStar(null)}
            disabled={disabled || isRating}
            className={cn(
              'transition-all duration-150 hover:scale-110',
              disabled || isRating
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer',
              star <= displayRating ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
            )}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            title={`Rate ${star} out of 5`}
          >
            <Star
              className={cn(
                iconSize,
                star <= displayRating && 'fill-current'
              )}
            />
          </button>
        ))}
        
        {(value !== undefined || tempRating !== null) && (
          <span className="text-xs text-muted-foreground ml-2">
            {tempRating ?? value}/5
          </span>
        )}
      </div>

      {showFeedback && (
        <div className="flex flex-col gap-2 p-3 border rounded-md bg-muted/30 animate-in slide-in-from-top-2">
          <label className="text-sm font-medium">
            {feedbackLabel}
          </label>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder={feedbackPlaceholder}
            className="min-h-[80px] resize-none"
            disabled={isRating}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFeedbackCancel}
              disabled={isRating}
            >
              <T context="button.cancel">Cancel</T>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleFeedbackSubmit}
              disabled={isRating}
            >
              {isRating ? submittingText : submitRatingText}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
