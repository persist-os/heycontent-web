'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { toast } from 'sonner'
import { 
  UserPlus, 
  Users, 
  Search, 
  Check, 
  X, 
  Mail,
  UserCheck,
  UserMinus,
  Clock
} from 'lucide-react'

interface FriendsTabProps {
  userId?: string
}

interface SearchResult {
  _id: string
  userId: string
  name: string
  email: string
  username?: string
  image?: string
  friendshipStatus?: 'none' | 'pending' | 'accepted' | 'blocked'
  requestSent?: boolean
}

const FriendsTab = ({ userId }: FriendsTabProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [friendshipStatuses, setFriendshipStatuses] = useState<Record<string, any>>({})

  // Convex queries
  const pendingRequests = useQuery(
    api.friendshipQueries.getPendingFriendRequests,
    userId ? { userId } : 'skip'
  )
  const friends = useQuery(
    api.friendshipQueries.getMyFriends,
    userId ? { userId } : 'skip'
  )
  const userPreferences = useQuery(
    api.friendshipQueries.getUserPreferences,
    userId ? { userId } : 'skip'
  )

  // Convex mutations
  const sendFriendRequest = useMutation(api.friendshipMutations.sendFriendRequest)
  const acceptFriendRequest = useMutation(api.friendshipMutations.acceptFriendRequest)
  const declineFriendRequest = useMutation(api.friendshipMutations.declineFriendRequest)
  const removeFriend = useMutation(api.friendshipMutations.removeFriend)
  const updateUserPreferences = useMutation(api.friendshipMutations.updateUserPreferences)

  // Loading states
  const isLoading = pendingRequests === undefined || friends === undefined

  // Search function with Convex integration
  const [isSearching, setIsSearching] = useState(false)
  
  const handleSearch = async () => {
    if (!searchQuery.trim() || !userId) return
    
    setIsSearching(true)
    try {
      // Import convex client for direct queries
      const { ConvexHttpClient } = await import('convex/browser')
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
      
      // Determine if search term is email or username
      const isEmail = searchQuery.includes('@')
      
      let results: any[] = []
      if (isEmail) {
        results = await convex.query(api.friendshipQueries.searchUsersByEmail, {
          searchTerm: searchQuery,
          currentUserId: userId,
          limit: 10
        })
      } else {
        results = await convex.query(api.friendshipQueries.searchUsersByUsername, {
          searchTerm: searchQuery,
          currentUserId: userId,
          limit: 10
        })
      }

      // Check friendship status for each result
      const resultsWithStatus = await Promise.all(
        results.map(async (user) => {
          try {
            const status = await convex.query(api.friendshipQueries.checkFriendshipStatus, {
              userId,
              targetUserId: user.userId
            })
            return {
              ...user,
              friendshipStatus: status.status,
              requestSent: status.status === 'pending'
            }
          } catch (error) {
            console.error('Error checking friendship status:', error)
            return {
              ...user,
              friendshipStatus: 'none',
              requestSent: false
            }
          }
        })
      )

      setSearchResults(resultsWithStatus)
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search users. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleAcceptRequest = async (friendshipId: string) => {
    if (!userId) return
    
    try {
      await acceptFriendRequest({
        userId,
        friendshipId: friendshipId as any
      })
      toast.success('Friend request accepted!')
    } catch (error) {
      console.error('Error accepting friend request:', error)
      toast.error('Failed to accept friend request. Please try again.')
    }
  }

  const handleDeclineRequest = async (friendshipId: string) => {
    if (!userId) return
    
    try {
      await declineFriendRequest({
        userId,
        friendshipId: friendshipId as any
      })
      toast.success('Friend request declined')
    } catch (error) {
      console.error('Error declining friend request:', error)
      toast.error('Failed to decline friend request. Please try again.')
    }
  }

  const handleSendRequest = async (targetUserId: string, message?: string) => {
    if (!userId) return
    
    try {
      await sendFriendRequest({
        userId,
        targetUserId,
        message
      })
      
      // Update search results to show request sent
      setSearchResults(prev => 
        prev.map(user => 
          user.userId === targetUserId 
            ? { ...user, requestSent: true, friendshipStatus: 'pending' }
            : user
        )
      )
      
      toast.success('Friend request sent!')
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send friend request')
    }
  }

  const handleRemoveFriend = async (friendUserId: string) => {
    if (!userId) return
    
    try {
      await removeFriend({
        userId,
        friendUserId
      })
      toast.success('Friend removed')
    } catch (error) {
      console.error('Error removing friend:', error)
      toast.error('Failed to remove friend. Please try again.')
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  if (!userId) {
    return <FriendsTabSkeleton />
  }

  return (
    <div className="space-y-12">
      {/* Friend Requests Section - Only show if there are pending requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-light tracking-tight text-foreground">Friend Requests</h2>
            <p className="text-muted-foreground">People who want to connect with you</p>
          </div>

          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request._id} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                        {request.requesterInfo.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-medium text-foreground">{request.requesterInfo.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span>{request.requesterInfo.email}</span>
                          {request.requesterInfo.username && (
                            <>
                              <span>•</span>
                              <span>@{request.requesterInfo.username}</span>
                            </>
                          )}
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(new Date(request.requestedAt).toISOString())}</span>
                        </div>
                        {request.requestMessage && (
                          <p className="text-sm text-muted-foreground italic">
                            "{request.requestMessage}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => handleAcceptRequest(request._id)}
                        size="sm"
                        className="bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleDeclineRequest(request._id)}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add separator if there are pending requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      )}

      {/* Find Friends Section */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-light tracking-tight text-foreground">Find Friends</h2>
          <p className="text-muted-foreground">Search for people to connect with</p>
        </div>

        <div className="space-y-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="border-border/50 focus:border-foreground/20 transition-colors duration-200"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Search Results</h3>
              {searchResults.map((user) => (
                <Card key={user._id} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-medium">
                          {user.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium text-foreground">{user.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span>{user.email}</span>
                            {user.username && (
                              <>
                                <span>•</span>
                                <span>@{user.username}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleSendRequest(user.userId)}
                        disabled={user.requestSent || user.friendshipStatus === 'accepted'}
                        size="sm"
                        variant={user.requestSent || user.friendshipStatus === 'accepted' ? "ghost" : "default"}
                        className={user.requestSent || user.friendshipStatus === 'accepted'
                          ? "text-muted-foreground" 
                          : "bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200"
                        }
                      >
                        {user.friendshipStatus === 'accepted' ? (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Already Friends
                          </>
                        ) : user.requestSent || user.friendshipStatus === 'pending' ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Request Sent
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Friend
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      {/* My Friends Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-light tracking-tight text-foreground">My Friends</h2>
            <p className="text-muted-foreground">
              {!friends || friends.length === 0 
                ? "You haven't added any friends yet" 
                : `${friends.length} ${friends.length === 1 ? 'friend' : 'friends'}`
              }
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{friends?.length || 0} total</span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !friends || friends.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-foreground">No friends yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Start connecting with people by searching for them above or sharing your profile with others.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {friends.map((friend) => (
              <Card key={friend._id} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-medium">
                          {friend.friendInfo.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background bg-green-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-foreground">{friend.friendInfo.name}</h3>
                          <Badge 
                            variant="default"
                            className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          >
                            friend
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span>{friend.friendInfo.email}</span>
                          {friend.friendInfo.username && (
                            <>
                              <span>•</span>
                              <span>@{friend.friendInfo.username}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Friends since {formatTimeAgo(new Date(friend.acceptedAt || friend.createdAt).toISOString())}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRemoveFriend(friend.friendInfo.userId)}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FriendsTabSkeleton() {
  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-64" />
        </div>
        
        <div className="space-y-6">
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
      
      <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FriendsTab