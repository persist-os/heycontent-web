/**
 * Gmail Authentication Hook
 * 
 * Checks Gmail auth status and provides auth flow initiation.
 */

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/app/context/auth-context'
import { useState } from 'react'
import { fetchWithApiKey } from '@/app/lib/api-helpers'

export function useGmailAuth() {
  const { firebaseUser } = useAuth()
  const userId = firebaseUser?.uid
  
  // Check if Gmail token exists in Convex
  const gmailToken = useQuery(
    api.gmailQueries.getGmailToken,
    userId ? { userId } : 'skip'
  )
  
  const [isConnecting, setIsConnecting] = useState(false)
  
  const isAuthenticated = !!gmailToken && gmailToken !== null
  const isLoading = gmailToken === undefined
  
  /**
   * Initiate Gmail OAuth flow
   * Opens Google OAuth consent screen in new window
   */
  const connectGmail = async (): Promise<void> => {
    if (!userId) {
      throw new Error('User must be authenticated to connect Gmail')
    }
    
    setIsConnecting(true)
    
    try {
      // Get auth URL from backend
      const response = await fetchWithApiKey('/api/platforms/gmail/auth', {
        method: 'GET'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to get Gmail auth URL')
      }
      
      const data = await response.json()
      const authUrl = data.auth_url
      
      // Open OAuth flow in popup window
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2
      
      const popup = window.open(
        authUrl,
        'Gmail Auth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      )
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.')
      }
      
      // Wait for popup to close (OAuth callback will redirect and close)
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          setIsConnecting(false)
          // Reload page to refresh Gmail token query
          window.location.reload()
        }
      }, 500)
      
      // Timeout after 5 minutes
      setTimeout(() => {
        if (!popup.closed) {
          popup.close()
          clearInterval(checkClosed)
          setIsConnecting(false)
          throw new Error('Gmail authentication timed out')
        }
      }, 5 * 60 * 1000)
      
    } catch (error) {
      setIsConnecting(false)
      throw error
    }
  }
  
  return {
    isAuthenticated,
    isLoading,
    isConnecting,
    connectGmail,
    gmailToken
  }
}

