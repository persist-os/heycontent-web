import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();

  try {
    const { userId } = await params;
    
    console.log(`[${requestId}] Token dam status request for user: ${userId}`);

    // Optional authentication - dam status can be viewed by the user
    const authHeader = request.headers.get('Authorization');
    const { apiKey } = extractAuthInfo(authHeader);

    // Get user's single dam status
    const userDamStatus = await convex.query(api.tokenDamQueries.getDamStatus, {
      userId,
    });

    // Transform data to match expected format for single dam
    const dams = userDamStatus.exists ? [{
      conversation_id: `user_dam_${userId}`, // Single dam identifier
      status: userDamStatus.damStatus === 'open' ? 'accumulating' :
              userDamStatus.damStatus === 'approaching' ? 'accumulating' :
              userDamStatus.damStatus === 'full' ? 'threshold_reached' :
              userDamStatus.damStatus === 'blocked' ? 'processing' : 'accumulating',
      accumulated_tokens: userDamStatus.currentTokens,
      token_limit: userDamStatus.tokenLimit,
      message_count: userDamStatus.exists ? userDamStatus.totalMessageCount : 0, // Actual message count
      progress_percentage: userDamStatus.percentageFull,
      is_processing: userDamStatus.processingPaused,
      last_updated: userDamStatus.lastUpdated || Date.now()
    }] : [];

    const damStatus = {
      totalDams: userDamStatus.exists ? 1 : 0, // Always 1 or 0 for single user dam
      dams: dams
    };

    const responseTime = Date.now() - startTime;

    console.log(`[${requestId}] Retrieved dam status`, {
      userId,
      totalDams: damStatus.totalDams,
      responseTime
    });

    return NextResponse.json({
      status: 'success',
      dam_status: damStatus,
      request_id: requestId,
      metadata: {
        processing_time_ms: responseTime,
        total_dams: damStatus.totalDams
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[${requestId}] Error fetching dam status:`, error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      request_id: requestId,
      metadata: {
        processing_time_ms: responseTime
      }
    }, { status: 500 });
  }
}
