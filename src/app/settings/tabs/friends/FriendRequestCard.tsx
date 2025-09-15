import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="w-full border border-border/50 hover:border-border/80 transition-colors duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - User info and message */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-foreground truncate">
                {request.requesterUsername}
              </h3>
            </div>
            
            {request.message && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {request.message}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              Sent {formatTimeAgo(request.sentAt)}
            </p>
          </div>
          
          {/* Right side - Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDecline?.(request.id)}
              className="h-8 w-8 p-0 border-red-200 hover:border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:border-red-700 dark:hover:bg-red-950/30"
              aria-label="Decline friend request"
            >
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </Button>
            <Button
              size="sm"
              onClick={() => onAccept?.(request.id)}
              className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
              aria-label="Accept friend request"
            >
              <Check className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
