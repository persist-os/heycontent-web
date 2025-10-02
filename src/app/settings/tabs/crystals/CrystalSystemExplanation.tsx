import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FeedbackModal } from '@/components/ui/feedback-modal';

export const CrystalSystemExplanation = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-foreground">How This Works</h3>
              <p className="text-muted-foreground">Understanding your conversation patterns</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 bg-muted/30 rounded text-muted-foreground">
                Experimental
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {isExpanded ? 'Less detail' : 'More detail'}
              </Button>
            </div>
          </div>

          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              Your conversations are analyzed to discover patterns about who you are. 
              Individual insights become <span className="font-medium text-foreground">shards</span>, 
              which combine into complete <span className="font-medium text-foreground"> crystals </span> 
              representing your personality patterns.
            </p>
            
            {isExpanded && (
              <div className="space-y-6 pt-4">
                <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium text-foreground">Content Collection</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Your conversations accumulate until there's enough content to analyze meaningfully
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium text-foreground">Pattern Discovery</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        AI identifies interesting insights about your preferences, behavior, and thinking patterns
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium text-foreground">Crystal Formation</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Related insights combine into complete personality patterns and characteristics
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium text-foreground">Smart Evolution</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Existing crystals grow stronger and more detailed instead of creating duplicates
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-foreground">What You'll See</h5>
                  
                  <div className="space-y-3">
                    <div className="border-l-2 border-blue-400/30 pl-4 space-y-1">
                      <div className="text-sm font-medium text-foreground">Shards</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        Individual discoveries like "enjoys working late" or "prefers visual explanations"
                      </div>
                    </div>
                    
                    <div className="border-l-2 border-purple-400/30 pl-4 space-y-1">
                      <div className="text-sm font-medium text-foreground">Crystals</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        Complete patterns like "Night Owl" that combine multiple related insights
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        
        <div className="space-y-3">
          <div className="bg-muted/30 p-4 rounded border-l-2 border-blue-400/60">
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Getting Started</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Don't see any shards or crystals yet? Start having chat conversations or making notes. 
                These interactions provide the content needed for the system to discover your patterns 
                and generate insights.
              </p>
            </div>
          </div>
          
          <div className="bg-muted/30 p-4 rounded border-l-2 border-amber-400/60">
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Early Development</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This system is actively being refined. Your feedback helps us improve how it 
                understands and represents personality patterns.
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Thoughts on how this works?
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFeedback(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Share feedback
            </Button>
          </div>
        </div>
      </div>

      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </>
  );
};
