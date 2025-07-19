'use client'

import React, { useState, useMemo } from 'react'
import { Check, Search, Filter, SortAsc, SortDesc, Calendar, Heart, MessageCircle, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Instagram } from 'lucide-react'
import { formatNumber } from '@/lib/content-utils'

interface InstagramPost {
  postId: string
  data: {
    caption?: string
    media_url?: string
    thumbnail_url?: string
    permalink?: string
    timestamp?: number
    like_count?: number
    comments_count?: number
    mediaType?: string
    children?: Array<{
      media_url?: string
      thumbnail_url?: string
      media_type?: string
    }>
  }
  analysis?: any
}

interface PostSelectionGridProps {
  posts: InstagramPost[]
  selectedPosts: string[]
  onSelectionChange: (selectedIds: string[]) => void
  maxSelection: number
  loading?: boolean
}

type SortOption = 'date' | 'engagement' | 'likes' | 'comments'
type SortDirection = 'asc' | 'desc'

export function PostSelectionGrid({
  posts,
  selectedPosts,
  onSelectionChange,
  maxSelection,
  loading = false
}: PostSelectionGridProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>('all')

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts.filter(post => {
      const matchesSearch = !searchTerm || 
        post.data.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.postId.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesMediaType = mediaTypeFilter === 'all' || 
        post.data.mediaType?.toLowerCase() === mediaTypeFilter.toLowerCase()
      
      return matchesSearch && matchesMediaType
    })

    // Sort posts
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'date':
          aValue = a.data.timestamp || 0
          bValue = b.data.timestamp || 0
          break
        case 'engagement':
          aValue = (a.data.like_count || 0) + (a.data.comments_count || 0)
          bValue = (b.data.like_count || 0) + (b.data.comments_count || 0)
          break
        case 'likes':
          aValue = a.data.like_count || 0
          bValue = b.data.like_count || 0
          break
        case 'comments':
          aValue = a.data.comments_count || 0
          bValue = b.data.comments_count || 0
          break
        default:
          aValue = a.data.timestamp || 0
          bValue = b.data.timestamp || 0
      }

      if (sortDirection === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })

    return filtered
  }, [posts, searchTerm, sortBy, sortDirection, mediaTypeFilter])

  // Selection handlers
  const handlePostToggle = (postId: string) => {
    const newSelection = selectedPosts.includes(postId)
      ? selectedPosts.filter(id => id !== postId)
      : selectedPosts.length < maxSelection
        ? [...selectedPosts, postId]
        : selectedPosts

    onSelectionChange(newSelection)
  }

  const handleSelectAll = () => {
    const availablePosts = filteredAndSortedPosts.slice(0, maxSelection)
    const newSelection = availablePosts.map(post => post.postId)
    onSelectionChange(newSelection)
  }

  const handleClearAll = () => {
    onSelectionChange([])
  }

  const handleSelectByEngagement = () => {
    const topPosts = filteredAndSortedPosts
      .sort((a, b) => {
        const aEngagement = (a.data.like_count || 0) + (a.data.comments_count || 0)
        const bEngagement = (b.data.like_count || 0) + (b.data.comments_count || 0)
        return bEngagement - aEngagement
      })
      .slice(0, maxSelection)
      .map(post => post.postId)
    
    onSelectionChange(topPosts)
  }

  // Get media URL for display
  const getMediaUrl = (post: InstagramPost) => {
    if (post.data.children && post.data.children.length > 0) {
      return post.data.children[0].media_url || post.data.children[0].thumbnail_url
    }
    return post.data.media_url || post.data.thumbnail_url
  }

  // Format date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown date'
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  // Get media type display
  const getMediaTypeDisplay = (mediaType?: string) => {
    if (!mediaType) return 'Post'
    switch (mediaType.toUpperCase()) {
      case 'IMAGE': return 'Image'
      case 'VIDEO': return 'Video'
      case 'CAROUSEL_ALBUM': return 'Carousel'
      case 'REELS': return 'Reel'
      default: return mediaType
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <select
            value={mediaTypeFilter}
            onChange={(e) => setMediaTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="carousel">Carousels</option>
            <option value="reels">Reels</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="date">Date</option>
            <option value="engagement">Engagement</option>
            <option value="likes">Likes</option>
            <option value="comments">Comments</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="outline" className="text-sm">
          {selectedPosts.length} of {maxSelection} selected
        </Badge>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={selectedPosts.length >= maxSelection}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={selectedPosts.length === 0}
          >
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectByEngagement}
            disabled={selectedPosts.length >= maxSelection}
          >
            Top by Engagement
          </Button>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAndSortedPosts.map((post) => {
          const isSelected = selectedPosts.includes(post.postId)
          const mediaUrl = getMediaUrl(post)
          const isCarousel = post.data.children && post.data.children.length > 1

          return (
            <Card
              key={post.postId}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected ? 'ring-2 ring-pink-500 bg-pink-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handlePostToggle(post.postId)}
            >
              <CardContent className="p-0">
                {/* Media */}
                <div className="relative aspect-square">
                  {mediaUrl ? (
                    <img
                      src={mediaUrl}
                      alt={post.data.caption || 'Instagram post'}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-t-lg flex items-center justify-center">
                      <Instagram className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Selection Indicator */}
                  <div className="absolute top-2 right-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isSelected 
                        ? 'bg-pink-500 text-white' 
                        : 'bg-white/80 text-gray-400 border border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Carousel Indicator */}
                  {isCarousel && (
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {post.data.children?.length || 0} photos
                    </div>
                  )}

                  {/* Media Type Badge */}
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {getMediaTypeDisplay(post.data.mediaType)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  {/* Caption */}
                  <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                    {post.data.caption || 'No caption'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>{formatNumber(post.data.like_count || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{formatNumber(post.data.comments_count || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(post.data.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredAndSortedPosts.length === 0 && (
        <div className="text-center py-8">
          <Instagram className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || mediaTypeFilter !== 'all' 
              ? 'No posts match your filters. Try adjusting your search or filters.'
              : 'No Instagram posts found. Connect your account to get started!'
            }
          </p>
        </div>
      )}
    </div>
  )
} 