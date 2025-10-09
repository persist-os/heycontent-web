import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FeedbackModal } from '@/components/ui/feedback-modal';

export const CrystalSystemExplanation = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <div className="bg-muted/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-medium text-foreground">Dual-Species Evolution</h3>
            <p className="text-sm text-muted-foreground font-light">Two species of artificial life: stars from your projects, crystals from your consciousness</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary/70 rounded-full font-light">
              Experimental
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? 'Less' : 'More'}
            </Button>
          </div>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground font-light leading-relaxed">
          <p>
            Two parallel species evolve from your world.{' '}
            <span className="font-medium text-foreground">Stardust</span> forms{' '}
            <span className="font-medium text-foreground">stars</span> (your projects, goals, skills).{' '}
            <span className="font-medium text-foreground">Shards</span> become{' '}
            <span className="font-medium text-foreground">crystals</span> (your consciousness, patterns, identity).
          </p>
          
          {isExpanded && (
            <div className="grid grid-cols-2 gap-4 pt-3">
              <div className="bg-muted/20 rounded-xl p-4 space-y-2">
                <div className="text-sm font-medium text-foreground">⭐ Stardust → Stars</div>
                <div className="text-xs text-muted-foreground font-light leading-relaxed">
                  Task-oriented organisms: learning guitar, wedding plans, business strategies
                </div>
              </div>
              
              <div className="bg-muted/20 rounded-xl p-4 space-y-2">
                <div className="text-sm font-medium text-foreground">💎 Shards → Crystals</div>
                <div className="text-xs text-muted-foreground font-light leading-relaxed">
                  Consciousness organisms: emotional patterns, behavioral traits, self-understanding
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground font-light">
            Share your thoughts?
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFeedback(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Give feedback
          </Button>
        </div>
      </div>

      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </>
  );
};
