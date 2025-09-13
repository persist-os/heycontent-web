'use client'

import React from 'react'
import { Users } from 'lucide-react'
import FriendCard from './FriendCard'

interface Friend {
  id: string
  username: string
  friendsSince: string
}

interface MyFriendsSectionProps {
  friends?: Friend[]
}

const MyFriendsSection: React.FC<MyFriendsSectionProps> = ({ friends = [] }) => {
  const handleShareContent = (friendId: string) => {
    // Non-functional for now
    console.log('Share content with friend:', friendId)
  }

  const handleRemoveFriend = (friendId: string) => {
    // Non-functional for now
    console.log('Remove friend:', friendId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-medium text-foreground">My Friends</h2>
          <span className="text-sm text-muted-foreground">({friends.length})</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your connections and share content with friends
        </p>
      </div>

      {/* Friends Grid or Empty State */}
      {friends.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <FriendCard
              key={friend.id}
              username={friend.username}
              friendsSince={friend.friendsSince}
              onShareContent={() => handleShareContent(friend.id)}
              onRemove={() => handleRemoveFriend(friend.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted/30 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground">No friends yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Start connecting with other creators to share content and collaborate on projects. 
                Your network is your net worth!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyFriendsSection
