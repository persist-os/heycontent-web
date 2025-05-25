import { User } from 'firebase/auth';
import Cookies from 'js-cookie';

const TOKEN_COOKIE_NAME = 'firebase-auth-token';

export const setFirebaseToken = (token: string) => {
  // Set cookie with 1 hour expiration
  Cookies.set(TOKEN_COOKIE_NAME, token, {
    expires: 1/24, // 1 hour
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
};

export const removeFirebaseToken = () => {
  Cookies.remove(TOKEN_COOKIE_NAME, { path: '/' });
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