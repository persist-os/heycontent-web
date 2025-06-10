import React from 'react';

export const ThinkingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1.5 text-gray-600">
      <span className="font-medium tracking-wide animate-pulse-slow">Thinking</span>
      <span className="flex space-x-0.5">
        <span className="animate-bounce-delay-1 text-heycontent-purple">.</span>
        <span className="animate-bounce-delay-2 text-heycontent-purple">.</span>
        <span className="animate-bounce-delay-3 text-heycontent-purple">.</span>
      </span>
    </div>
  );
}; 