/**
 * Open Graph Metadata Hook
 * 
 * Pattern: PT:41 (Component-First Development)
 * Fetches Open Graph metadata for URLs with caching
 */

import { useState, useEffect } from 'react'
import { fetchWithApiKey } from '@/app/lib/api-helpers'

export interface OpenGraphMetadata {
  title: string
  description: string | null
  image: string | null
  url: string
}

interface UseOpenGraphMetadataResult {
  metadata: OpenGraphMetadata | null
  loading: boolean
  error: Error | null
}

// Cache for metadata (avoid refetching same URLs)
const metadataCache = new Map<string, OpenGraphMetadata>()

export function useOpenGraphMetadata(url: string): UseOpenGraphMetadataResult {
  const [metadata, setMetadata] = useState<OpenGraphMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Skip if no URL
    if (!url || !url.startsWith('http')) {
      setLoading(false)
      return
    }

    // Check cache first
    const cached = metadataCache.get(url)
    if (cached) {
      setMetadata(cached)
      setLoading(false)
      return
    }

    // Fetch metadata
    const fetchMetadata = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetchWithApiKey(
          `/api/v1/links/metadata?url=${encodeURIComponent(url)}`
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`)
        }

        const data = await response.json()
        
        const ogMetadata: OpenGraphMetadata = {
          title: data.title || url,
          description: data.description || null,
          image: data.image || null,
          url: data.url || url,
        }

        // Cache the result
        metadataCache.set(url, ogMetadata)
        setMetadata(ogMetadata)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch metadata')
        setError(error)
        console.error('[useOpenGraphMetadata] Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetadata()
  }, [url])

  return { metadata, loading, error }
}

