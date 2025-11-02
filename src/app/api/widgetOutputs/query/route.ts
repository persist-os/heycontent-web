import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const { apiKey } = extractAuthInfo(authHeader);

    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { userId, useIndex, indexFields } = body;
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required' 
      }, { status: 400 });
    }
    
    if (useIndex === 'by_project' && indexFields?.projectId) {
      // Query widget outputs by project using generic query
      const outputs = await convex.query(api.widgetOutputsQueries.getWidgetOutputData, {
        userId,
        useIndex,
        indexFields
      });
      
      return NextResponse.json({ 
        success: true, 
        data: outputs 
      });
    }
    
    return NextResponse.json({ 
      error: 'Invalid query parameters' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('[API Route Error] /api/widgetOutputs/query:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error.message 
    }, { status: 500 });
  }
}

