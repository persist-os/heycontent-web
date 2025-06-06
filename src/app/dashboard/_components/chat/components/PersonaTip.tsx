import React from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';

interface PersonaTipProps {
  onTipClick: (message: string) => void;
  userId?: string;
}

export const PersonaTip: React.FC<PersonaTipProps> = ({ onTipClick }) => {
  const handleClick = () => {
    onTipClick('hey content write my persona');
  };

  return (
    <div className="w-full p-3 sm:p-4 mb-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl shadow-sm animate-in slide-in-from-top-2 duration-500">
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
          <button
            onClick={handleClick}
            className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] w-full sm:w-auto justify-center sm:justify-start"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="break-words">{"hey content write my persona"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 