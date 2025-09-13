'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Share, UserMinus } from 'lucide-react'

interface FriendCardProps {
  username: string
  friendsSince: string
  onShareContent?: () => void
  onRemove?: () => void
}

const FriendCard: React.FC<FriendCardProps> = ({
  username,
  friendsSince,
  onShareContent,
  onRemove
}) => {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 hover:border-border transition-colors duration-200">
      <div className="space-y-3">
        {/* User Info */}
        <div className="space-y-1">
          <h3 className="font-medium text-foreground text-sm">{username}</h3>
          <p className="text-xs text-muted-foreground">Friends since {friendsSince}</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onShareContent}
            className="flex-1 h-8 text-xs font-medium"
          >
            <Share className="w-3 h-3 mr-1.5" />
            Share Content
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <UserMinus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FriendCard
