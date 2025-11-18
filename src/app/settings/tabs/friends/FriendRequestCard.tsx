import React from 'react';
import { BaseCard } from '@/components/ui/base-card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface FriendRequest {
  id: string;
  requesterUsername: string;
  message?: string;
  sentAt: Date;
}

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
};

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({
  request,
  onAccept,
  onDecline
}) => {
  return (
    <BaseCard 
      variant="friend-request" 
      title={request.requesterUsername}
      timestamp={`Sent ${formatTimeAgo(request.sentAt)}`}
      summary={request.message}
    >
      <div className="flex items-center gap-2 flex-shrink-0 mt-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDecline?.(request.id)}
          className="h-8 w-8 p-0 border-red-200 hover:border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:border-red-700 dark:hover:bg-red-950/30 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
          aria-label="Decline friend request"
        >
          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
        </Button>
        <Button
          size="sm"
          onClick={() => onAccept?.(request.id)}
          className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
          aria-label="Accept friend request"
        >
          <Check className="w-4 h-4 text-white" />
        </Button>
      </div>
    </BaseCard>
  );
};
