import { api } from "@/convex/_generated/api";
import { create_user } from "@/convex/userMutations";
import { fetchQuery, fetchMutation, fetchAction } from "convex/nextjs";

export const logger = {
  info: (message: string, context: Record<string, any> = {}) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[INFO] [${new Date().toISOString()}] ${message}`, context);
    }
  },
  warn: (message: string, context: Record<string, any> = {}) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, context);
    }
  },
  error: (message: string, error: any, context: Record<string, any> = {}) => {
    const sanitizedContext = { ...context };
    delete sanitizedContext.userId;
    delete sanitizedContext.email;
    delete sanitizedContext.name;
    delete sanitizedContext.idToken;
    delete sanitizedContext.token;
    console.error(
      `[ERROR] [${new Date().toISOString()}] ${message}`,
      {
        error: error && typeof error.message === "string" ? error.message : "Unknown error",
        stack: error?.stack,
        ...sanitizedContext,
      }
    );
  },
  debug: (message: string, context: Record<string, any> = {}) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`, context);
    }
  },
};

export async function updateOrCreateConvexUser(userId: string, name: string, email: string, image: string, username?: string, referredBy?: string) {
  logger.debug('Saving user data to Convex', {
    hasImage: !!image,
    hasUsername: !!username,
    hasReferredBy: !!referredBy,
    referredByLength: referredBy?.length || 0,
    referredByType: typeof referredBy
  });

  // Check if user exists (by userId, then email)
  let existingUser = null;
  try {
    existingUser = await fetchQuery(api.userQueries.getUserDetails, { email });
    // If userId is available and doesn't match, try to find by userId
    if ((!existingUser || (existingUser && existingUser.userId !== userId)) && userId) {
      // Try to find by userId (if you have a userQueries.getUserByUserId, use it)
      // For now, fallback to email only
    }
  } catch (err) {
    logger.error('Error checking for existing user', err);
  }

  if (existingUser && existingUser.userId === userId) {
    // Only update safe fields (never referralCode, referredBy, or subscription)
    const updates: Record<string, any> = {};
    if (name && name !== existingUser.name) updates.name = name;
    if (typeof image !== 'undefined' && image !== existingUser.image) updates.image = image;
    // Only update username if it's provided and different
    if (username && username !== existingUser.username) updates.username = username;
    updates.updatedAt = Date.now();
    if (Object.keys(updates).length > 1 || (Object.keys(updates).length === 1 && !updates.hasOwnProperty('updatedAt'))) {
      // Use updateUser mutation if available, otherwise skip
      try {
        await fetchMutation(api.userMutations.updateUser, { userId: existingUser.id, updates });
      } catch (err) {
        logger.error('Error updating user', err);
      }
    } else {
      // Always update updatedAt
      try {
        await fetchMutation(api.userMutations.updateUser, { userId: existingUser.id, updates: { updatedAt: Date.now() } });
      } catch (err) {
        logger.error('Error updating user updatedAt', err);
      }
    }
    logger.debug('User already existed, updated safe fields only');
    return;
  }

  // If no user exists, create a new one with all fields
  try {
    const result = await fetchMutation(api.userMutations.create_user, {
      name,
      email,
      image,
      username: username || '', // Only default to empty string for new users
      referredBy: referredBy || '', // Only default to empty string for new users
      userId,
      // referralCode is generated in the mutation, don't need to pass it
    });
  } catch (err) {
    logger.error('Error creating user', err);
  }
}

export function mapAuthErrorCodeToMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/user-disabled":
      return "This account has been disabled";
    case "auth/user-not-found":
      return "No account found with this email";
    case "auth/wrong-password":
      return "Incorrect password";
    case "auth/email-already-in-use":
      return "An account with this email already exists";
    case "auth/weak-password":
      return "Password is too weak";
    default:
      return "Something went wrong";
  }
}

// Helper to redact tokens for logs
export function redactToken(token: string | undefined): string {
  if (!token) return "null";
  return `${token.substring(0, 10)}...${token.substring(token.length - 5)}`;
}
