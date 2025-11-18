'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { BaseCard } from '@/components/ui/base-card'
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
    <BaseCard variant="friend" title={username} timestamp={`Friends since ${friendsSince}`}>
      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onShareContent}
          className="flex-1 h-8 text-xs font-medium min-h-[44px] md:min-h-0"
        >
          <Share className="w-3 h-3 mr-1.5" />
          Share Content
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
        >
          <UserMinus className="w-3 h-3" />
        </Button>
      </div>
    </BaseCard>
  )
}

export default FriendCard
