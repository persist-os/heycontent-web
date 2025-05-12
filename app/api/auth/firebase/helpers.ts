import { api } from "@/convex/_generated/api";
import { create_user } from "@/convex/userMutations";
import { fetchQuery, fetchMutation, fetchAction } from "convex/nextjs";

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

export async function updateOrCreateConvexUser(userId: string, name: string, email: string, image: string, username: string, referredBy: string) {
  await fetchMutation(api.userMutations.create_user, {
    name,
    email,
    image,
    username,
    referredBy,
    userId
  })

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
