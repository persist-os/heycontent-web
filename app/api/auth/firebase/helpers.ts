import { api } from "@/convex/_generated/api";

export const logger = {
  info: (message: string, context: Record<string, any> = {}) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, context);
  },
  warn: (message: string, context: Record<string, any> = {}) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, context);
  },
  error: (message: string, error: any, context: Record<string, any> = {}) => {
    console.error(
      `[ERROR] [${new Date().toISOString()}] ${message}`,
      {
        error: error && typeof error.message === "string" ? error.message : "Unknown error",
        stack: error?.stack,
        ...context,
      }
    );
  },
  debug: (message: string, context: Record<string, any> = {}) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`, context);
    }
  },
};

export async function ensureConvexUser(convex: any, user: { uid: string; displayName?: string; email?: string; photoURL?: string }, requestId: string) {
  // Ensures user exists in Convex, creates if not
  try {
    const convexUser = await convex.query(api.users.getUserById, { userId: user.uid });
    if (!convexUser) {
      logger.info("User not found in Convex, creating user...", { requestId, userId: user.uid });
      const convexStartTime = Date.now();
      await convex.action(api.auth.createUser, {
        userId: user.uid,
        name: user.displayName || "Unknown User",
        email: user.email || "",
        image: user.photoURL || "",
      });
      logger.info("User created in Convex", {
        requestId,
        userId: user.uid,
        processingTime: Date.now() - convexStartTime,
      });
    }
  } catch (convexError) {
    logger.error("Error with Convex user operation", convexError, { requestId, userId: user.uid });
    // Continue with auth flow even if Convex operation fails
  }
}

export async function updateConvexUser(convex: any, decodedToken: any, convexUser: any, requestId: string) {
  // Updates user info in Convex
  try {
    logger.info("User found in Convex, updating user information...", { requestId, userId: decodedToken.uid });
    const updateStartTime = Date.now();
    await convex.action(api.auth.updateUser, {
      userId: decodedToken.uid,
      name: decodedToken.name || convexUser.name || "Unknown User",
      email: decodedToken.email || convexUser.email || "",
      image: decodedToken.picture || convexUser.image || "",
    });
    logger.info("User updated in Convex", {
      requestId,
      userId: decodedToken.uid,
      processingTime: Date.now() - updateStartTime,
    });
  } catch (convexError) {
    logger.error("Error updating Convex user", convexError, { requestId, userId: decodedToken.uid });
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
