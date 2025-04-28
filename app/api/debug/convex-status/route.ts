import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function GET() {
  try {
    console.log('Testing Convex connection...');
    
    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Test connection by getting all users
    const users = await convex.query(api.users.list);
    
    // Get environment info
    const envInfo = {
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ? 'Set' : 'Not set',
      nodeEnv: process.env.NODE_ENV
    };
    
    return NextResponse.json({
      success: true,
      message: 'Convex connection successful',
      userCount: users.length,
      environment: envInfo
    });
  } catch (error) {
    console.error('Convex connection test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
