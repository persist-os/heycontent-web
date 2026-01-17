import { NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }
    
    // Extract the API key
    const apiKey = authHeader.substring(7).replace(/"/g, '');
    
    // Extract user ID from API key
    const apiKeyParts = apiKey.split('_');
    const user_id = apiKeyParts.length >= 2 && apiKeyParts[0] === 'heycontext' ? apiKeyParts[1] : null;
    
    if (!user_id) {
      console.warn(`[${requestId}] Invalid API key format`);
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 401 });
    }

    // Parse request body to get userId (for double-checking)
    const body = await request.json();
    const userId = body.userId || user_id;
    
    // Remove existing insights for the user
    await convex.mutation(api.ambientInsights.removeInsights, { userId });
    
    return NextResponse.json({ success: true, message: 'Ambient insights removed successfully' });
  } catch (error) {
    console.error(`[${requestId}] Error removing ambient insights:`, error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
