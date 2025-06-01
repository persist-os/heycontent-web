import { User } from 'firebase/auth';
import Cookies from 'js-cookie';

const TOKEN_COOKIE_NAME = 'firebase-auth-token';

export const setFirebaseToken = (token: string) => {
  // Set both httpOnly (SSR) and client-accessible cookies for maximum compatibility
  Cookies.set(TOKEN_COOKIE_NAME, token, {
    expires: 1 / 24, // 1 hour
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  // Optionally, set via document.cookie for SSR (if needed)
  if (typeof document !== 'undefined') {
    document.cookie = `${TOKEN_COOKIE_NAME}=${token}; path=/; max-age=${60 * 60}; SameSite=Lax; secure=${process.env.NODE_ENV === 'production'}`;
  }
};

export const removeFirebaseToken = () => {
  Cookies.remove(TOKEN_COOKIE_NAME, { path: '/' });
  if (typeof document !== 'undefined') {
    document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax; secure=${process.env.NODE_ENV === 'production'}`;
  }
};

export const getFirebaseToken = (): string | undefined => {
  return Cookies.get(TOKEN_COOKIE_NAME);
};

export const updateTokenForUser = async (user: User) => {
  try {
    const token = await user.getIdToken(true);
    setFirebaseToken(token);
    return token;
  } catch (error) {
    console.error('Error updating token:', error);
    removeFirebaseToken();
    throw error;
  }
}; 