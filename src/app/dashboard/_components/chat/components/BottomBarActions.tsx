import React from 'react';
import { bottomBarActions } from '../data/bottom-bar-actions';

interface BottomBarActionsProps {
  onActionClick: (action: string) => void;
}

export const BottomBarActions: React.FC<BottomBarActionsProps> = ({ onActionClick }) => {
  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {bottomBarActions.map((action) => (
            <button
              key={action.id}
              onClick={() => onActionClick(action.action)}
              className="shrink-0 px-4 h-8 text-xs text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 
                rounded-full flex items-center transition-colors whitespace-nowrap"
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
