import { auth } from '@/app/lib/auth'
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export const validateToken = async (userId: string, platform: string): Promise<string> => {
  const token = await convex.query(api.tokens.get, { userId, platform })
  
  if (!token) {
    throw new Error(`No valid token found for ${platform}`)
  }

  // Check if token is expired
  if (token.expiresAt < Date.now()) {
    throw new Error(`Token expired for ${platform}`)
  }

  return token.accessToken
} 