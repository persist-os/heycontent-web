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
      {/* CSS to hide scrollbar */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .hide-scrollbar {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* Internet Explorer 10+ */
          }
          
          .hide-scrollbar::-webkit-scrollbar {
            display: none; /* Safari and Chrome */
          }
        `
      }} />
      
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-3xl sm:max-w-4xl mx-auto px-3 sm:px-4 py-2">
          {/* Horizontal scrollable container */}
          <div className="overflow-x-auto overflow-y-hidden hide-scrollbar">
            <div className="flex gap-2 min-w-max pb-1">
              {bottomBarActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action.action)}
                  className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-black 
                    bg-heycontent-yellow hover:bg-heycontent-yellow/90 
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
    </>
  );
};

export default BottomBarActions;
