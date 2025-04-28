import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function GET() {
  try {
    console.log('Testing Convex actions...');
    
    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Test user data
    const testUser = {
      userId: 'test-user-' + Date.now(),
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/image.jpg'
    };
    
    console.log('Creating test user with action:', testUser);
    
    // Call the createUser action
    const result = await convex.action(api.auth.createUser, testUser);
    
    console.log('Action result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Convex action test successful',
      result
    });
  } catch (error) {
    console.error('Convex action test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
