import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function GET() {
  try {
    console.log('Testing Convex connection...');
    
    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Log the Convex URL for debugging
    console.log('Convex URL:', process.env.NEXT_PUBLIC_CONVEX_URL);
    
    // Test basic query
    try {
      console.log('Testing basic query...');
      const users = await convex.query(api.users.list);
      console.log('Query successful, users:', users.length);
    } catch (queryError) {
      console.error('Query error:', queryError);
      return NextResponse.json({
        success: false,
        error: 'Query error',
        message: queryError instanceof Error ? queryError.message : 'Unknown error',
        stage: 'query'
      }, { status: 500 });
    }
    
    // Test basic mutation
    try {
      console.log('Testing basic mutation...');
      const testUser = {
        userId: 'test-user-' + Date.now(),
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/image.jpg'
      };
      
      const userId = await convex.mutation(api.users.create, testUser);
      console.log('Mutation successful, user ID:', userId);
    } catch (mutationError) {
      console.error('Mutation error:', mutationError);
      return NextResponse.json({
        success: false,
        error: 'Mutation error',
        message: mutationError instanceof Error ? mutationError.message : 'Unknown error',
        stage: 'mutation'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Convex connection test successful',
      environment: {
        convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ? 'Set' : 'Not set',
        nodeEnv: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    console.error('Convex test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
