import React, { useState } from 'react';
import { Sparkles, MessageCircle, HelpCircle } from 'lucide-react';

interface PersonaTipProps {
  onTipClick: (message: string) => void;
  userId?: string;
}

export const PersonaTip: React.FC<PersonaTipProps> = ({ onTipClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleClick = () => {
    localStorage.setItem('personaTipClicked', 'true');
    onTipClick('hey content write my persona');
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed left-4 bottom-48 z-10">
      {isExpanded ? (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl shadow-md p-3 max-w-xs animate-in fade-in duration-300">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="text-sm font-semibold text-purple-800 animate-pulse">
                  {"✨ Ready for your persona?"}
                </h4>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                {"When you're ready to create your personalized content persona, just say the magic words!"}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleClick}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-sm"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span className="break-words">{"Create my persona"}</span>
                </button>
                <button
                  aria-label="Persona tip"
                  onClick={toggleExpand}
                  className="p-2 bg-white text-purple-500 rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={toggleExpand}
          className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-md flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all duration-200 animate-pulse"
          aria-label="Persona tip"
        >
          <Sparkles className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}; 