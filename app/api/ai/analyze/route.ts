import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function POST(req: Request) {
  console.log('Starting analysis request');
  try {
    const session = await auth();
    if (!session?.user) {
      console.log('Unauthorized request - no session user');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await req.json();
    
    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Get platform status for all supported platforms
    const supportedPlatforms = ['youtube', 'instagram', 'tiktok', 'gmail'];
    
    const platformStatus = await Promise.all(
      supportedPlatforms.map(async (platform) => {
        const userAccounts = await convex.query(api.social.getConnectedAccounts, { 
          userId: session.user.id 
        });
        const account = userAccounts.find(acc => acc.platform === platform);
        return {
          platform,
          isConnected: !!account,
          lastSync: account?.updatedAt ? new Date(account.updatedAt) : null,
          error: account ? undefined : 'Not connected'
        };
      })
    );
    
    // Get platform-specific data if requested
    let platformData = {};
    if (type === 'youtube') {
      try {
        const youtubeData = await convex.query(api.youtube.getYouTubeData, { 
          userId: session.user.id 
        });
        platformData = { youtube: youtubeData };
      } catch (error) {
        console.error('Error fetching YouTube data:', error);
        platformData = { youtube: null };
      }
    }
    
    return NextResponse.json({ 
      platformStatus,
      ...platformData
    });
  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 