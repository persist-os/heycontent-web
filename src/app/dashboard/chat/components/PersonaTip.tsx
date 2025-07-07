import React, { useState } from 'react';
import { MessageCircle, Info, X } from 'lucide-react';

// Add a simple sparkle SVG component
const Sparkle = () => (
  <svg className="absolute -top-2 -right-2 w-5 h-5 animate-sparkle" viewBox="0 0 20 20" fill="none">
    <g filter="url(#glow)">
      <path d="M10 2 L12 8 L18 10 L12 12 L10 18 L8 12 L2 10 L8 8 Z" fill="#facc15"/>
    </g>
    <defs>
      <filter id="glow" x="-5" y="-5" width="30" height="30" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  </svg>
);

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
    <div className="fixed right-4 bottom-24 z-10">
      {isExpanded ? (
        <div className="relative bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs w-64 animate-in fade-in-20 slide-in-from-bottom-4 duration-300">
          {/* Sparkle in the corner */}
          <Sparkle />
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
          className="w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all relative animate-glow"
          aria-label="Show persona tip"
        >
          <Info className="w-5 h-5" />
        </button>
      )}
      {/* Animations */}
      <style jsx global>{`
        @keyframes glow {
          0% { box-shadow: 0 0 0px 0 #facc15, 0 0 0px 0 #facc15; }
          50% { box-shadow: 0 0 12px 4px #facc15aa, 0 0 24px 8px #fde68a55; }
          100% { box-shadow: 0 0 0px 0 #facc15, 0 0 0px 0 #facc15; }
        }
        .animate-glow {
          animation: glow 1.8s infinite;
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.7; transform: scale(1) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(15deg); }
        }
        .animate-sparkle {
          animation: sparkle 1.2s infinite;
        }
      `}</style>
    </div>
  );
}; 