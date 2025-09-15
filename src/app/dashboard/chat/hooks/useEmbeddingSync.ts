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
  const userHeartbeat = useAction(api.embeddingSystem.userHeartbeat)

  // Embedding sync heartbeat for active chat users  
  useEffect(() => {
    if (!userId) return

    // Set up heartbeat every 2 minutes when actively chatting for responsive queue processing
    const heartbeatInterval = setInterval(async () => {
      try {
        console.log('💓 [CHAT HEARTBEAT] Triggering sync for active chat user')
        await userHeartbeat({ userId })
      } catch (error) {
        console.error('Chat heartbeat sync failed:', error)
      }
    }, 2 * 60 * 1000) // 2 minutes - more frequent for active users

    return () => clearInterval(heartbeatInterval)
  }, [userId, userHeartbeat])

  // Check for existing embeddings when user changes
  useEffect(() => {
    const checkEmbeddings = async () => {
      if (userId) {
        console.log('🔍 [CHAT CONTAINER] Checking user embeddings for:', userId)
        try {
          const info = await checkUserEmbeddings(userId)
          console.log('🔍 [CHAT CONTAINER] Embedding info received:', info)
          setEmbeddingInfo(info)
        } catch (error) {
          console.error('🔍 [CHAT CONTAINER] Error checking embeddings:', error)
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
