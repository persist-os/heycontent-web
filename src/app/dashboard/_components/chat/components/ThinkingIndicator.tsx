import React from 'react';

export const ThinkingIndicator: React.FC = () => {
  return (
    <div className="flex items-center">
      <span className="relative text-gray-600 dark:text-gray-400 font-medium tracking-wide overflow-hidden">
        <span className="inline-block">Thinking...</span>
        {/* Shiny shine effect that moves from left to right */}
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shine"></span>
      </span>
    </div>
  );
}; 