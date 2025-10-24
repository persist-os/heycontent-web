import React, { useState, useRef, useEffect } from 'react';
import { actionSets } from '../data/bottomActions';

interface BottomBarActionsProps {
  onActionClick: (action: string) => void;
  onInputPopulate?: (action: string) => void;
  isFullScreen?: boolean;
  suggestions?: string[];  // Dynamic suggestions from backend
}

export const BottomBarActions: React.FC<BottomBarActionsProps> = ({ 
  onActionClick, 
  onInputPopulate, 
  isFullScreen = false,
  suggestions = []
}) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  
  // Use dynamic suggestions if available, otherwise use first action set (consistent)
  const actionsToDisplay = suggestions.length > 0 
    ? suggestions.map((text, index) => ({
        id: `suggestion-${index}`,
        text,
        action: text
      }))
    : actionSets[0];

  useEffect(() => {
    if (!isFullScreen && scrollRef.current) {
      const element = scrollRef.current;
      const hasScroll = element.scrollWidth > element.clientWidth;
      setShowScrollHint(hasScroll);
    }
  }, [isFullScreen]);

  const handleActionClick = (action: string, actionId: string) => {
    setActiveAction(actionId);
    onActionClick(action);
    
    setTimeout(() => {
      setActiveAction(null);
    }, 300);
  };

  const ActionButton = ({ action, index }: { action: typeof actionsToDisplay[0], index: number }) => {
    const isActive = activeAction === action.id;
    const isPrimary = index < 3;
    
    return (
      <button
        key={action.id}
        onClick={() => handleActionClick(action.action, action.id)}
        className={`
          group relative flex-shrink-0 flex items-center justify-center 
          px-4 py-2 rounded-full
          ${isPrimary 
            ? 'bg-primary/10 hover:bg-primary/15 border-primary/30 hover:border-primary/40' 
            : 'bg-card/90 hover:bg-card border-border/50 hover:border-border'
          }
          backdrop-blur-md
          border
          transition-all duration-300 ease-out
          hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/5
          active:scale-[0.98] active:shadow-sm
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          ${isActive ? 'scale-[0.98] shadow-sm' : ''}
          ${isFullScreen ? '' : 'min-w-fit'}
        `}
        aria-label={action.text}
        type="button"
      >
        {/* Glassmorphism gradient overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Text */}
        <span className={`
          relative text-sm font-medium whitespace-nowrap text-center
          ${isPrimary 
            ? 'text-foreground group-hover:text-foreground' 
            : 'text-foreground group-hover:text-foreground'
          }
          transition-colors duration-300
        `}>
          {action.text}
        </span>

        {/* Active state indicator */}
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary rounded-full animate-in fade-in duration-150" />
        )}
      </button>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .action-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .action-scroll::-webkit-scrollbar {
            display: none;
          }
          
          @keyframes scroll-hint {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
          
          .scroll-hint {
            animation: scroll-hint 2s ease-in-out infinite;
          }
        `
      }} />
      
      {/* Container with subtle gradient background */}
      <div className="relative bg-gradient-to-b from-background via-background to-muted/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {isFullScreen ? (
            /* Full screen: Grid layout for better organization */
            <div className="py-4">
              {/* Primary actions - larger and more prominent */}
              <div className="flex flex-wrap gap-2 justify-center mb-3">
                {actionsToDisplay.slice(0, 3).map((action, index) => (
                  <ActionButton key={action.id} action={action} index={index} />
                ))}
              </div>
              
              {/* Divider with subtle gradient */}
              {actionsToDisplay.length > 3 && (
                <div className="relative h-px bg-gradient-to-r from-transparent via-border to-transparent mb-3" />
              )}
              
              {/* Secondary actions - organized grid */}
              {actionsToDisplay.length > 3 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {actionsToDisplay.slice(3).map((action, index) => (
                    <ActionButton key={action.id} action={action} index={index + 3} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Split screen: Horizontal scroll with enhanced UX */
            <div className="relative py-3">
              {/* Scroll hint - left gradient fade */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
              
              {/* Scrollable container */}
              <div 
                ref={scrollRef}
                className="overflow-x-auto action-scroll"
              >
                <div className="flex gap-2.5 pb-1 min-w-max px-2">
                  {actionsToDisplay.map((action, index) => (
                    <ActionButton key={action.id} action={action} index={index} />
                  ))}
                </div>
              </div>
              
              {/* Scroll hint - right gradient fade */}
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
              
              {/* Scroll indicator hint */}
              {/* {showScrollHint && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground text-xs scroll-hint pointer-events-none">
                  <span className="hidden sm:inline">Scroll</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )} */}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BottomBarActions;
