/**
 * GALLERY NAVIGATION HOOK
 * 
 * State management hook for gallery navigation.
 * Handles current item tracking, prev/next navigation,
 * keyboard shortcuts, and URL synchronization.
 * 
 * PATTERN COMPLIANCE:
 * - Pure logic, no UI
 * - React hooks best practices
 * - URL synchronization via replaceState (no history spam)
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { GalleryItem } from '@/types/gallery'

interface UseGalleryNavigationProps {
  items: GalleryItem[]
  initialItemId: string
  projectId: string
  onClose: () => void
}

export function useGalleryNavigation({
  items,
  initialItemId,
  projectId,
  onClose
}: UseGalleryNavigationProps) {
  const router = useRouter()
  
  // Find initial index
  const [currentIndex, setCurrentIndex] = useState(() => {
    const index = items.findIndex(item => item._id === initialItemId)
    return index >= 0 ? index : 0
  })
  
  // Derived state
  const currentItem = items[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < items.length - 1
  
  // Navigation functions
  const goToPrev = useCallback(() => {
    setCurrentIndex(i => Math.max(0, i - 1))
  }, [])
  
  const goToNext = useCallback(() => {
    setCurrentIndex(i => Math.min(items.length - 1, i + 1))
  }, [items.length])
  
  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentIndex(index)
    }
  }, [items.length])
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNext()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrev, goToNext, onClose])
  
  // URL synchronization (replaceState to avoid history spam)
  useEffect(() => {
    const item = items[currentIndex]
    if (item) {
      const url = `/dashboard/living-projects/${projectId}/gallery?id=${item._id}`
      window.history.replaceState(null, '', url)
    }
  }, [currentIndex, items, projectId])
  
  return {
    currentItem,
    currentIndex,
    total: items.length,
    hasPrev,
    hasNext,
    goToPrev,
    goToNext,
    goToIndex
  }
}

