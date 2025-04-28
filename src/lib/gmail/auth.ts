import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

// Create a client instance outside of the function
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const storeGmailCredentials = async (
  tokenResponse: {
    access_token: string;
    refresh_token: string;
    scope: string;
    expiry_date: number;
  }
) => {
  await convex.mutation(api.gmailTokens.storeGmailTokens, {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiryDate: tokenResponse.expiry_date,
    scope: tokenResponse.scope,
  });
};