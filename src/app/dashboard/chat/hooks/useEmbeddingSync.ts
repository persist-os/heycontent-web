import { useEffect } from 'react'
import { useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { checkUserEmbeddings } from '../utils/api-utils'
import type { EmbeddingInfo } from '../types/chat-container.types'

interface UseEmbeddingSyncProps {
  userId?: string
  setEmbeddingInfo: React.Dispatch<React.SetStateAction<EmbeddingInfo>>
}

export function useEmbeddingSync({ userId, setEmbeddingInfo }: UseEmbeddingSyncProps) {
  console.log('[EMBEDDING] useEmbeddingSync called', {
    timestamp: Date.now(),
    userId
  })

  const userHeartbeat = useAction(api.embeddingSystem.userHeartbeat)

  // Embedding sync heartbeat for active chat users  
  useEffect(() => {
    console.log('[EMBEDDING] Heartbeat effect triggered', {
      timestamp: Date.now(),
      userId
    })
    if (!userId) return

    console.log('[EMBEDDING] Setting up heartbeat interval', {
      timestamp: Date.now(),
      userId,
      intervalMinutes: 3
    })

    // Set up heartbeat every 3 minutes when actively chatting (reduced frequency)
    const heartbeatInterval = setInterval(async () => {
      try {
        console.log('[EMBEDDING] Sync triggered', {
          userId,
          timestamp: Date.now(),
          action: 'heartbeat'
        })
        await userHeartbeat({ userId })
      } catch (error) {
        console.error('[EMBEDDING] Chat heartbeat sync failed:', error)
      }
    }, 3 * 60 * 1000) // 3 minutes - reduced frequency to prevent overload

    return () => {
      console.log('[EMBEDDING] Cleaning up heartbeat interval', {
        timestamp: Date.now(),
        userId
      })
      clearInterval(heartbeatInterval)
    }
  }, [userId, userHeartbeat])

  // Check for existing embeddings when user changes
  useEffect(() => {
    console.log('[EMBEDDING] Embedding check effect triggered', {
      timestamp: Date.now(),
      userId
    })
    const checkEmbeddings = async () => {
      if (userId) {
        console.log('[EMBEDDING] About to check user embeddings', {
          timestamp: Date.now(),
          userId
        })
        try {
          const info = await checkUserEmbeddings(userId)
          console.log('[EMBEDDING] Embedding info received', {
            timestamp: Date.now(),
            userId,
            info
          })
          console.log('[STATE] About to update embedding info', {
            timestamp: Date.now(),
            newInfo: info
          })
          setEmbeddingInfo(info)
        } catch (error) {
          console.error('[EMBEDDING] Error checking embeddings:', error)
          console.log('[STATE] About to set default embedding info due to error', {
            timestamp: Date.now()
          })
          // Set default values on error
          setEmbeddingInfo({ hasEmbeddings: false, count: 0 })
        }
      }
    }

    if (userId) {
      checkEmbeddings()
    }
  }, [userId, setEmbeddingInfo])
}
