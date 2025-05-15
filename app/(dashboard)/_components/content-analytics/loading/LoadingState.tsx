import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  type: 'auth' | 'content' | 'error';
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  type,
  message
}) => {
  const getContent = () => {
    switch(type) {
      case 'auth':
        return (
          <>
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Authenticating...</span>
          </>
        );
      case 'content':
        return (
          <>
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading content...</span>
          </>
        );
      case 'error':
        return <span>{message || 'Please log in to view content analytics.'}</span>;
      default:
        return <span>Loading...</span>;
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      {getContent()}
    </div>
  );
};
