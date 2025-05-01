import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api"

import { google } from 'googleapis'

// This function should not be called on the frontend or in Next.js API routes.
// All token validation/refresh logic must be handled by the backend (FastAPI).
export const validateToken = async (_userId: string, _platform: string): Promise<string> => {
  throw new Error("validateToken is deprecated on the frontend. Use the backend API for token validation and refresh.");
};