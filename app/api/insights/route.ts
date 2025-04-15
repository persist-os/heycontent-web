import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function GET(req: Request) {
  try {
    const token = cookies().get('firebase-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

    // Get the user ID from the token
    const userId = await convex.query(api.auth.getUserIdFromToken, { token });
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get insights from Convex
    const insights = await convex.query(api.notes.getAIInsights, { userId });

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error in insights route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 