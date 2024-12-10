import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('YouTube route hit');
  
  try {
    // Just return a test response first
    return NextResponse.json({ 
      test: true,
      message: 'YouTube route is working'
    });
  } catch (error) {
    console.error('YouTube route error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
} 