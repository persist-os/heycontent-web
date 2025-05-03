import { api } from "@/convex/_generated/api";


// Create a client instance outside of the function


export const storeGmailCredentials = async (
  tokenResponse: {
    access_token: string;
    refresh_token: string;
    scope: string;
    expiry_date: number;
  }
) => {
  // Convex storage for Gmail tokens is now handled exclusively by the backend (FastAPI). This function is now a no-op.
};