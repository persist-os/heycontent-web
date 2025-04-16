import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

// Action code settings for the email link
const actionCodeSettings = {
  // URL you want to redirect back to. The domain must be in the authorized domains list in Firebase Console
  url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/signin`,
  // This must be true for email link sign-in
  handleCodeInApp: true,
};

/**
 * Sends a sign-in link to the user's email
 * @param email The user's email address
 */
export const sendEmailLink = async (email: string) => {
  try {
    const auth = getAuth();
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    
    // Save the email locally so we can use it later
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('emailForSignIn', email);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email link:', error);
    return { success: false, error };
  }
};

/**
 * Completes the sign-in process with the email link
 * @param email The user's email address
 * @param url The complete URL from the email link
 */
export const completeEmailSignIn = async (email: string, url: string) => {
  try {
    const auth = getAuth();
    
    // Sign in the user directly without verification
    const result = await signInWithEmailLink(auth, email, url);
    
    // Clear the email from storage
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('emailForSignIn');
    }
    
    return { success: true, result };
  } catch (error) {
    console.error('Error completing email sign-in:', error);
    return { success: false, error };
  }
};

/**
 * Checks if the current URL is an email link
 */
export const isEmailLink = () => {
  if (typeof window === 'undefined') return false;
  
  const auth = getAuth();
  return isSignInWithEmailLink(auth, window.location.href);
};

/**
 * Gets the stored email for sign-in
 */
export const getStoredEmail = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('emailForSignIn');
}; 