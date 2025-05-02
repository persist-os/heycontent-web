import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function GET(req: Request) {
  try {
    const token = cookies().get('firebase-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the token
    const userId = await fetchQuery(api.queries.getUserIdFromToken, { token });
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get insights from Convex
    const insights = await fetchQuery(api.notes.getAIInsights, { userId });

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error in insights route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 