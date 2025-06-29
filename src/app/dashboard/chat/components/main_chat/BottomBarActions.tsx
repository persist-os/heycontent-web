import React from 'react';
import { bottomBarActions } from '../../data/bottom-bar-actions';

interface BottomBarActionsProps {
  onActionClick: (action: string) => void;
  onInputPopulate?: (action: string) => void;
}

export const BottomBarActions: React.FC<BottomBarActionsProps> = ({ onActionClick, onInputPopulate }) => {
  // Always use onActionClick to auto-send messages
  const handleActionClick = onActionClick;
  
  return (
    <>
      {/* CSS to hide scrollbar and add fade effects */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .hide-scrollbar {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* Internet Explorer 10+ */
          }
          
          .hide-scrollbar::-webkit-scrollbar {
            display: none; /* Safari and Chrome */
          }

          .fade-edges {
            position: relative;
          }

          .fade-edges::before,
          .fade-edges::after {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            width: 40px;
            pointer-events: none;
            z-index: 1;
          }

          .fade-edges::before {
            left: 0;
            background: linear-gradient(to right, white, transparent);
          }

          .fade-edges::after {
            right: 0;
            background: linear-gradient(to left, white, transparent);
          }

          /* Dark mode fade effects */
          .dark .fade-edges::before {
            background: linear-gradient(to right, hsl(var(--background)), transparent);
          }

          .dark .fade-edges::after {
            background: linear-gradient(to left, hsl(var(--background)), transparent);
          }
        `
      }} />
      
      <div className="bg-background border-t border-border">
        <div className="max-w-3xl sm:max-w-4xl mx-auto px-3 sm:px-4 py-2">
          {/* Horizontal scrollable container with fade effects */}
          <div className="relative fade-edges">
            <div className="overflow-x-auto overflow-y-hidden hide-scrollbar">
              <div className="flex gap-2 px-5 pb-1" style={{ minWidth: 'max-content' }}>
                {bottomBarActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action.action)}
                    className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-primary-foreground dark:text-black 
                      bg-primary hover:bg-primary/90 dark:bg-accent dark:hover:bg-accent/90
                      rounded-full transition-all duration-200 hover:shadow-sm
                      whitespace-nowrap select-none chat-font"
                  >
                    {action.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomBarActions;
