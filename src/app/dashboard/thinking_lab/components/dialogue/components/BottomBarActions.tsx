import React from 'react';
import { bottomBarActions } from '../data/bottomActions';

interface BottomBarActionsProps {
  onActionClick: (action: string) => void;
  onInputPopulate?: (action: string) => void;
  isFullScreen?: boolean;
}

export const BottomBarActions: React.FC<BottomBarActionsProps> = ({ onActionClick, onInputPopulate, isFullScreen = false }) => {
  return null; // Hide the blue buttons as requested
  
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
        `
      }} />
      
      <div className="bg-background py-3">
        <div className="max-w-4xl mx-auto px-6">
          {isFullScreen ? (
            /* Full screen: Use flexbox wrapping for better space utilization */
            <div className="flex flex-wrap gap-2 justify-center">
              {bottomBarActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => onActionClick(action.action)}
                  className="group flex items-center justify-center px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10 
                    border border-primary/20 hover:border-primary/30 transition-all duration-300 
                    hover:scale-[1.02] hover:shadow-sm"
                >
                  <span className="text-xs font-medium text-primary group-hover:text-primary 
                    transition-colors duration-300 whitespace-nowrap text-center">
                    {action.text}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* Split screen: Use horizontal scroll for space efficiency */
            <div className="overflow-x-auto action-scroll">
              <div className="flex gap-3 pb-1 min-w-max">
                {bottomBarActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => onActionClick(action.action)}
                    className="group flex-shrink-0 flex items-center justify-center px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10 
                      border border-primary/20 hover:border-primary/30 transition-all duration-300 
                      hover:scale-[1.02] hover:shadow-sm"
                  >
                    <span className="text-xs font-medium text-primary group-hover:text-primary 
                      transition-colors duration-300 whitespace-nowrap text-center">
                      {action.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BottomBarActions;
