'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2, UserPlus, Users, Mail } from 'lucide-react'

interface FriendSearchResult {
  id: string
  username: string
  email?: string
  name?: string
  status: 'none' | 'friends' | 'request_sent' | 'request_received'
}

interface FriendSearchProps {
  className?: string
}

// Mock data for demonstration
const mockSearchResults: FriendSearchResult[] = [
  {
    id: '1',
    username: 'sarah_creator',
    email: 'sarah@example.com',
    name: 'Sarah Johnson',
    status: 'none'
  },
  {
    id: '2',
    username: 'mike_content',
    email: 'mike@example.com',
    name: 'Mike Chen',
    status: 'friends'
  },
  {
    id: '3',
    username: 'alex_writer',
    email: 'alex@example.com',
    name: 'Alex Rivera',
    status: 'request_sent'
  },
  {
    id: '4',
    username: 'emma_blogger',
    email: 'emma@example.com',
    name: 'Emma Davis',
    status: 'request_received'
  },
  {
    id: '5',
    username: 'john_video',
    name: 'John Smith',
    status: 'none'
  }
]

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function FriendSearch({ className }: FriendSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Simulate search functionality
  const performSearch = useMemo(() => {
    return async (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        setHasSearched(false)
        return
      }

      setIsSearching(true)
      setHasSearched(true)

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))

      // Filter mock results based on query
      const filtered = mockSearchResults.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase()) ||
        user.name?.toLowerCase().includes(query.toLowerCase())
      )

      setSearchResults(filtered)
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    performSearch(debouncedSearchQuery)
  }, [debouncedSearchQuery, performSearch])

  const getStatusButton = (user: FriendSearchResult) => {
    switch (user.status) {
      case 'friends':
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>Already Friends</span>
          </div>
        )
      case 'request_sent':
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserPlus className="w-4 h-4" />
            <span>Request Sent</span>
          </div>
        )
      case 'request_received':
        return (
          <Button 
            variant="outline" 
            size="sm"
            className="text-sm border-border/50 hover:border-foreground/20 transition-colors duration-200"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Accept Request
          </Button>
        )
      default:
        return (
          <Button 
            variant="outline" 
            size="sm"
            className="text-sm border-border/50 hover:border-foreground/20 transition-colors duration-200"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Send Request
          </Button>
        )
    }
  }

  return (
    <div className={className}>
      {/* Search Input */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-foreground">Find Friends</h3>
          <p className="text-sm text-muted-foreground">
            Search for friends by username or email address
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for friends by username or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-border/50 focus:border-foreground/20 transition-colors duration-200"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="mt-6">
        {!hasSearched && !searchQuery.trim() && (
          <div className="text-center py-12 px-4 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground text-lg">Search for Friends</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-md mx-auto">
                Search for friends by username or email to connect and share content together.
              </p>
            </div>
          </div>
        )}

        {isSearching && searchQuery.trim() && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-sm font-medium">Searching for friends...</p>
            </div>
          </div>
        )}

        {hasSearched && !isSearching && searchResults.length === 0 && searchQuery.trim() && (
          <div className="text-center py-12 px-4 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground text-lg">No Results Found</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-md mx-auto">
                No users found matching "{searchQuery}". Try searching with a different username or email.
              </p>
            </div>
          </div>
        )}

        {hasSearched && !isSearching && searchResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </p>
            </div>
            
            <div className="space-y-3">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-border transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">@{user.username}</p>
                        {user.name && (
                          <span className="text-sm text-muted-foreground">• {user.name}</span>
                        )}
                      </div>
                      {user.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {getStatusButton(user)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
