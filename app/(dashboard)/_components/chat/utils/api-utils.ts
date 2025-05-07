import { auth } from '@/app/lib/firebase';
import { ChatResponseData } from '../types';

import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Get API key from localStorage or request a new one
 */
export async function getApiKey(): Promise<string | null> {
  try {
    // First try to get the API key from localStorage
    const storedApiKey = localStorage.getItem('apiKey');
    let needsRefresh = false;
    if (storedApiKey) {
      const apiKey = JSON.parse(storedApiKey);
      // Check for invalid/temporary key
      const isValid = (typeof apiKey === 'string' && !apiKey.endsWith('_temporary'));
      // Check if the key matches the current user
      let userMatches = false;
      let keyUserId = null, firebaseUserId = null;
      if (isValid && auth && auth.currentUser) {
        // Extract userId from the API key (assuming format: heycontent_<userId>_...)
        const keyParts = apiKey.split('_');
        if (keyParts.length >= 3) {
          keyUserId = keyParts[1];
          firebaseUserId = auth.currentUser.uid;
          userMatches = keyUserId === firebaseUserId;
        }
      }
      console.log('[getApiKey] Firebase user:', firebaseUserId, '| API key:', apiKey, '| Extracted user from key:', keyUserId, '| Match:', userMatches);
      if (!isValid || !userMatches) {
        console.warn('API key in localStorage is invalid or does not match current user. Removing and refreshing...');
        localStorage.removeItem('apiKey');
        needsRefresh = true;
      } else {
        // Valid key found for current user
        console.log('Retrieved API key from localStorage for current user');
        return apiKey;
      }
    } else {
      needsRefresh = true;
    }

    // If no valid API key and we have a Firebase user, request one from the backend
    if (needsRefresh && auth && auth.currentUser) {
      const userId = auth.currentUser.uid;
      console.log('No valid API key found, requesting one for user:', userId);
      try {
        // Get a fresh Firebase ID token
        const idToken = await auth.currentUser.getIdToken(true);
        console.log('Got Firebase ID token, sending to backend to create API key...');
        // Request an API key via our API proxy to avoid CSP issues
        const response = await fetch('/api/auth/key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            idToken,
            userId: userId,
            action: 'refresh'
          }),
        });
        if (response.ok) {
          const data = await response.json();
          let apiKeyValue = data.apiKey;
          // Accept key from data.data.key if present (backend returns this structure)
          if (!apiKeyValue && data.data && typeof data.data.key === 'string') {
            apiKeyValue = data.data.key;
          }
          // Log the full backend response for debugging
          console.log('[getApiKey] Full backend response:', data);
          // Log the userId we requested and the key returned
          console.log('[getApiKey] Requested API key for Firebase user:', userId, '| API key received from backend:', apiKeyValue);
          if (typeof apiKeyValue === 'string' && apiKeyValue.startsWith('heycontent_') && !apiKeyValue.endsWith('_temporary')) {
            localStorage.setItem('apiKey', JSON.stringify(apiKeyValue));
            console.log('API key saved to localStorage:', apiKeyValue);
            // Log what is now in localStorage
            console.log('API key in localStorage after save:', localStorage.getItem('apiKey'));
            return apiKeyValue;
          } else {
            console.warn('Received invalid or temporary API key from backend:', apiKeyValue);
            localStorage.removeItem('apiKey');
            return null;
          }
        } else {
          const errorData = await response.json();
          console.warn('Failed to get API key from backend:', errorData);
          return null;
        }
      } catch (apiError) {
        console.error('Error requesting API key from backend:', apiError);
        return null;
      }
      // No API key available if backend fails
      return null;
    }
    
    // If we get here, it means needsRefresh is true but no auth/currentUser is available
    console.log('No valid API key and no authenticated user to request one');
    return null;
  } catch (error) {
    console.error('Error getting API key:', error);
    throw new Error('No valid API key available. Please contact support.');
  }
}




/**
 * Get the current user ID from Firebase Auth
 */
export function getCurrentUserId(): string | null {
  if (auth && auth.currentUser) {
    return auth.currentUser.uid;
  }
  return null;
}

/**
 * Send a chat message to the API
 */
export async function sendChatMessage(
  content: string, 
  isFirstMessage: boolean, 
  sessionId: string | null
): Promise<ChatResponseData> {
  // Get API key - make sure we have one before proceeding
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const requestBody: any = {
    query: content,
    is_first_message: isFirstMessage
  };

  // Only include session_id for subsequent messages
  if (!isFirstMessage && sessionId) {
    requestBody.session_id = sessionId;
  }

  // Do NOT include user_id in the request body; backend extracts it from API key

  console.log('Sending chat message:', requestBody);
  console.log('Sending Authorization header:', apiKey);

  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return await response.json();
}

/**
 * Save conversation to backend storage
 */
export async function saveConversation(
  messages: any[], 
  title: string, 
  sessionId: string | null, 
  conversationId?: string
) {
  // Only save if we have messages
  if (messages.length < 1) {
    console.log('No messages to save');
    return null;
  }

  try {
    console.log('Saving conversation:', { 
      messageCount: messages.length,
      sessionId,
      conversationId,
      mode: conversationId ? 'update' : 'create',
      firstMessage: messages[0]?.content?.substring(0, 30),
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 30)
    });

    const response = await fetch('/api/chat/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        title,
        sessionId,
        conversationId // Pass the conversationId if available
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to save conversation - API error:', {
        status: response.status,
        error: errorData
      });
      throw new Error(`Failed to save conversation: ${response.status}`);
    }

    const data = await response.json();
    console.log('Conversation saved successfully:', {
      conversationId: data.conversationId,
      action: data.metadata?.action || 'unknown',
      timestamp: data.metadata?.timestamp
    });
    return data.conversationId;
  } catch (error) {
    console.error('Failed to save conversation:', error);
    return null;
  }
}

/**
 * Load conversation by ID
 */
export async function loadConversation(id: string) {
  try {
    const response = await fetch(`/api/chat/conversation/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to load conversation: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to load conversation:', error);
    throw error;
  }
}

/**
 * Generate a fallback session ID when the backend doesn't provide one
 */
export function generateLocalSessionId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}
