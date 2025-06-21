import React, { useState } from 'react';
import { MessageCircle, Info, X } from 'lucide-react';

interface PersonaTipProps {
  onTipClick: (message: string) => void;
  userId?: string;
}

export const PersonaTip: React.FC<PersonaTipProps> = ({ onTipClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    localStorage.setItem('personaTipClicked', 'true');
    onTipClick('hey content write my persona');
    setIsExpanded(false);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed left-4 bottom-24 z-10">
      {isExpanded ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs w-64 animate-in fade-in-20 slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-semibold text-gray-800">
              Create Your Persona
            </h4>
            <button
              onClick={toggleExpand}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close tip"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Ready to create your personalized content persona? Just say the magic words!
          </p>
          <p className="text-xs text-gray-500 mb-4">
            (For best results, please disable smart search)
          </p>
          <button
            onClick={handleClick}
            className="w-full inline-flex items-center justify-center px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors duration-200"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            <span>Create my persona</span>
          </button>
        </div>
      ) : (
        <button
          onClick={toggleExpand}
          className="w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all"
          aria-label="Show persona tip"
        >
          <Info className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}; 