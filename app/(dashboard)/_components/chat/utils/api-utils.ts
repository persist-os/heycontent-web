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
    if (storedApiKey) {
      const apiKey = JSON.parse(storedApiKey);
      console.log('Retrieved API key from localStorage');
      return apiKey;
    }
    
    // If no API key and we have a Firebase user, request one from the backend
    if (auth && auth.currentUser) {
      const userId = auth.currentUser.uid;
      console.log('No API key found, requesting one for user:', userId);
      
      try {
        // Get a fresh Firebase ID token
        const idToken = await auth.currentUser.getIdToken(true);
        console.log('Got Firebase ID token, sending to backend to create API key...');
        
        // Request an API key via our API proxy to avoid CSP issues
        const response = await fetch('/api/auth/key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            idToken,
            userId: userId,
            action: 'refresh'
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.apiKey) {
            localStorage.setItem('apiKey', JSON.stringify(data.apiKey));
            console.log('API key received and saved to localStorage');
            return data.apiKey;
          }
        } else {
          const errorData = await response.json();
          console.warn('Failed to get API key from backend:', errorData);
        }
      } catch (apiError) {
        console.error('Error requesting API key from backend:', apiError);
      }
      
      // Fallback: Create and use a temporary API key
      console.log('Using temporary API key as fallback');
      const tempApiKey = createTemporaryApiKey(userId);
      localStorage.setItem('apiKey', JSON.stringify(tempApiKey));
      return tempApiKey;
    }
  } catch (error) {
    console.error('Error getting API key:', error);
  }
  
  return null;
}

/**
 * Create a temporary API key format using user ID
 */
export function createTemporaryApiKey(userId: string): string {
  return `heycontent_${userId}_temporary`;
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
  let apiKey = await getApiKey();
  let userId = getCurrentUserId();

  if (!apiKey && !userId) {
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

  // Always explicitly include the user_id in the request
  if (userId) {
    requestBody.user_id = userId;
  }
      
  console.log('Sending chat message:', requestBody);

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
export async function saveConversation(messages: any[], title: string, sessionId: string | null) {
  // Only save if we have messages
  if (messages.length < 1) {
    console.log('No messages to save');
    return null;
  }

  try {
    console.log('Saving conversation with messages:', messages.length);

    const response = await fetch('/api/chat/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        title,
        sessionId
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
    console.log('Conversation saved successfully:', data);
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
