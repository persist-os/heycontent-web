import React, { useState, useEffect } from 'react';
import { MessageCircle, Info, X, Clock } from 'lucide-react';
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { getCurrentUserId } from '@/app/lib/api-helpers';

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
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID using Firebase auth pattern
  useEffect(() => {
    const fetchUserId = () => {
      const currentUserId = getCurrentUserId();
      setUserId(currentUserId);
    };
    
    fetchUserId();
    
    // Set up an interval to check for user ID changes
    const interval = setInterval(fetchUserId, 1000);
    return () => clearInterval(interval);
  }, []);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFloatingTip, setShowFloatingTip] = useState(() => {
    // Only show if user hasn't clicked before
    return typeof window !== 'undefined' && localStorage.getItem('personaFloatingTipDismissed') !== 'true';
  });

  // Check persona generation eligibility
  const eligibility = useQuery(
    api.personas.checkPersonaGenerationEligibility,
    userId ? { userId } : "skip"
  );

  const handleClick = () => {
    if (eligibility?.canGenerate) {
      localStorage.setItem('personaTipClicked', 'true');
      setShowFloatingTip(false);
      onTipClick('hey content write my persona');
      setIsExpanded(false);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setShowFloatingTip(false);
    localStorage.setItem('personaFloatingTipDismissed', 'true');
  };

  const handleFloatingTipClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFloatingTip(false);
    localStorage.setItem('personaFloatingTipDismissed', 'true');
  };

  return (
    <div className="fixed right-4 bottom-24 z-10 flex flex-col items-end" data-persona-tip>
      {/* Floating friendly tip */}
      {showFloatingTip && !isExpanded && (
        <div className="mb-2 relative animate-in fade-in-20 slide-in-from-bottom-2 duration-300">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg px-4 py-3 max-w-xs w-72 flex items-start gap-2 relative">
            <span className="text-lg">{eligibility?.canGenerate ? '✨' : '🌱'}</span>
            <div className="flex-1">
              <span className="block text-sm font-medium text-yellow-900">
{eligibility?.canGenerate ? (
                  'Ready to shine? '
                ) : (
                  'Your persona is growing! '
                )}<span className="font-semibold">{eligibility?.canGenerate ? 'Tap below when you feel inspired to create your persona!' : 'We\'ll help you evolve it soon!'}</span>
              </span>
              <span className="block text-xs text-yellow-700 mt-1">
                Your journey starts with a single conversation. No rush—when you're ready, I'll help you figure things out!
              </span>
            </div>
            <button
              onClick={handleFloatingTipClose}
              className="ml-2 mt-0.5 text-yellow-400 hover:text-yellow-600 focus:outline-none"
              aria-label="Dismiss tip"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* PersonaTip main button or expanded card */}
      {isExpanded ? (
        <div className="relative bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs w-64 animate-in fade-in-20 slide-in-from-bottom-4 duration-300">
          {/* Sparkle in the corner */}
          <Sparkle />
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-semibold text-gray-800">
              {eligibility?.canGenerate ? 'Create Your Persona' : 'Persona Growth Phase'}
            </h4>
            <button
              onClick={toggleExpand}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close tip"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {eligibility?.canGenerate ? (
            <>
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
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">
                🌱 How I remember you is growing! I help you update this every 2 weeks to track changes, capture new goals, and stay aligned with who you're becoming.
              </p>
              {eligibility?.daysRemaining && (
                                  <p className="text-xs text-emerald-600 mb-4 flex items-center">
                    <span className="mr-1">🌟</span>
                    Your evolution continues in {eligibility.daysRemaining} day{eligibility.daysRemaining !== 1 ? 's' : ''}!
                  </p>
              )}
                              <button
                  disabled
                  className="w-full inline-flex items-center justify-center px-3 py-2 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-md cursor-not-allowed"
                >
                  <span className="mr-2">🌱</span>
                  <span>Growing stronger every day</span>
                </button>
            </>
          )}
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