import React from 'react';
import { RefreshState } from '@/components/ui/refresh-state';

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
          <RefreshState
            title="Authenticating..."
            quote="Verifying your credentials"
          />
        );
      case 'content':
        return (
          <RefreshState
            title="Loading content..."
            quote={message || "Fetching your content"}
          />
        );
      case 'error':
        return (
          <div className="text-center text-gray-600">
            {message || 'Please log in to view content analytics.'}
          </div>
        );
      default:
        return (
          <RefreshState
            title="Loading..."
            quote="Please wait"
          />
        );
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      {getContent()}
    </div>
  );
};
