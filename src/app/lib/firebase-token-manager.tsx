import { User } from 'firebase/auth';
import Cookies from 'js-cookie';

const TOKEN_COOKIE_NAME = 'firebase-auth-token';
const TOKEN_EXPIRY_COOKIE_NAME = 'firebase-token-expiry';

// Token refresh threshold - refresh when token has less than 10 minutes left
const TOKEN_REFRESH_THRESHOLD = 10 * 60 * 1000; // 10 minutes in milliseconds

export const setFirebaseToken = (token: string, user?: User) => {
  // Calculate expiry time (Firebase tokens expire after 1 hour)
  const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour from now
  
  // Set both httpOnly (SSR) and client-accessible cookies for maximum compatibility
  Cookies.set(TOKEN_COOKIE_NAME, token, {
    expires: 1 / 24, // 1 hour
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  
  // Store the expiry time
  Cookies.set(TOKEN_EXPIRY_COOKIE_NAME, expiryTime.toString(), {
    expires: 1 / 24, // 1 hour
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  
  // Optionally, set via document.cookie for SSR (if needed)
  if (typeof document !== 'undefined') {
    document.cookie = `${TOKEN_COOKIE_NAME}=${token}; path=/; max-age=${60 * 60}; SameSite=Lax; secure=${process.env.NODE_ENV === 'production'}`;
    document.cookie = `${TOKEN_EXPIRY_COOKIE_NAME}=${expiryTime}; path=/; max-age=${60 * 60}; SameSite=Lax; secure=${process.env.NODE_ENV === 'production'}`;
  }
};

export const removeFirebaseToken = () => {
  Cookies.remove(TOKEN_COOKIE_NAME, { path: '/' });
  Cookies.remove(TOKEN_EXPIRY_COOKIE_NAME, { path: '/' });
  if (typeof document !== 'undefined') {
    document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax; secure=${process.env.NODE_ENV === 'production'}`;
    document.cookie = `${TOKEN_EXPIRY_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax; secure=${process.env.NODE_ENV === 'production'}`;
  }
};

export const getFirebaseToken = (): string | undefined => {
  return Cookies.get(TOKEN_COOKIE_NAME);
};

export const getTokenExpiry = (): number | null => {
  const expiry = Cookies.get(TOKEN_EXPIRY_COOKIE_NAME);
  return expiry ? parseInt(expiry, 10) : null;
};

export const isTokenExpiringSoon = (): boolean => {
  const expiry = getTokenExpiry();
  if (!expiry) return true; // If no expiry info, assume it's expiring
  
  const now = Date.now();
  return (expiry - now) < TOKEN_REFRESH_THRESHOLD;
};

export const isTokenExpired = (): boolean => {
  const expiry = getTokenExpiry();
  if (!expiry) return true; // If no expiry info, assume it's expired
  
  return Date.now() >= expiry;
};

export const updateTokenForUser = async (user: User, forceRefresh: boolean = false) => {
  try {
    // Check if we need to refresh
    if (!forceRefresh && !isTokenExpiringSoon()) {
      const currentToken = getFirebaseToken();
      if (currentToken) {
        return currentToken; // Return existing token if it's still valid
      }
    }
    
    console.log('Refreshing Firebase token...');
    const token = await user.getIdToken(true); // Force refresh
    setFirebaseToken(token, user);
    console.log('Firebase token refreshed successfully');
    return token;
  } catch (error) {
    console.error('Error updating token:', error);
    removeFirebaseToken();
    throw error;
  }
};

export const getValidToken = async (user: User): Promise<string> => {
  try {
    // Check if current token is still valid
    if (!isTokenExpired() && !isTokenExpiringSoon()) {
      const currentToken = getFirebaseToken();
      if (currentToken) {
        return currentToken;
      }
    }
    
    // Token is expired or expiring soon, refresh it
    return await updateTokenForUser(user, true);
  } catch (error) {
    console.error('Error getting valid token:', error);
    throw error;
  }
}; 