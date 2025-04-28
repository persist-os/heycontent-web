import { auth } from '@/app/lib/auth'
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"
import { google } from 'googleapis'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export const validateToken = async (userId: string, platform: string): Promise<string> => {
  try {
    console.log(`Validating ${platform} token for user ${userId}`);
    
    const token = await convex.query(api.tokens.get, { userId, platform })
    if (!token) {
      console.error(`No token found for ${platform}`);
      throw new Error(`No valid token found for ${platform}`)
    }

    // Check if token is expired or will expire soon (within 5 minutes)
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    if (token.expiresAt < Date.now() + bufferTime) {
      console.log(`Token for ${platform} is expired or expiring soon, attempting to refresh...`)

      if (!token.refreshToken) {
        console.error(`No refresh token available for ${platform}`);
        throw new Error(`No refresh token available for ${platform}`)
      }

      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          platform === 'gmail'
            ? `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/gmail`
            : process.env.YOUTUBE_REDIRECT_URI
        )

        oauth2Client.setCredentials({
          refresh_token: token.refreshToken
        })

        const { credentials } = await oauth2Client.refreshAccessToken()
        console.log(`Successfully refreshed ${platform} token`);

        if (!credentials.access_token) {
          throw new Error('No access token received after refresh')
        }

        // Update token in Convex
        await convex.mutation(api.tokens.save, {
          userId,
          platform,
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token || token.refreshToken,
          expiresAt: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : Date.now() + 3600 * 1000,
          scope: token.scope
        })

        return credentials.access_token
      } catch (error) {
        console.error(`Failed to refresh ${platform} token:`, error)
        throw new Error(`Failed to refresh token for ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Token is still valid
    console.log(`Using existing valid token for ${platform}`);
    return token.accessToken
  } catch (error) {
    console.error(`Token validation error for ${platform}:`, error)
    throw error
  }
}