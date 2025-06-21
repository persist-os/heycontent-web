import React from 'react';
import { bottomBarActions } from '../data/bottom-bar-actions';

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
            width: 20px;
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
        `
      }} />
      
      <div className="bg-white">
        <div className="max-w-3xl sm:max-w-4xl mx-auto px-3 sm:px-4 py-3">
          {/* Horizontal scrollable container with fade effects */}
          <div className="relative fade-edges">
            <div className="overflow-x-auto overflow-y-hidden hide-scrollbar">
              <div className="flex gap-2 px-5 pb-1" style={{ minWidth: 'max-content' }}>
                {bottomBarActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action.action)}
                    className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-black 
                      bg-heycontent-yellow hover:bg-heycontent-yellow/90 
                      rounded-full transition-all duration-200 hover:shadow-sm
                      select-none chat-font min-w-fit text-center"
                  >
                    <span className="break-words text-nowrap">{action.text}</span>
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
