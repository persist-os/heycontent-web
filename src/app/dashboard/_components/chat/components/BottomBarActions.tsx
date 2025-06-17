import React from 'react';
import { bottomBarActions } from '../data/bottom-bar-actions';

interface BottomBarActionsProps {
  onActionClick: (action: string) => void;
  onInputPopulate?: (action: string) => void;
}

export const BottomBarActions: React.FC<BottomBarActionsProps> = ({ onActionClick, onInputPopulate }) => {
  // Use onInputPopulate if available, otherwise fall back to onActionClick
  const handleActionClick = onInputPopulate || onActionClick;
  
  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="max-w-4xl sm:max-w-5xl mx-auto px-3 sm:px-4 py-2">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {bottomBarActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.action)}
              className="px-2 sm:px-4 h-7 sm:h-8 text-xs text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 
                rounded-full flex items-center transition-colors break-words"
            >
              {action.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomBarActions;
