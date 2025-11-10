import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { success: false, error: 'Backend URL is not configured' },
        { status: 500 },
      );
    }

    const authHeader = request.headers.get('Authorization');
    const { apiKey, userId } = extractAuthInfo(authHeader);

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: API key required' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const payload = {
      ...body,
      user_id: body?.user_id ?? userId ?? null,
    };

    const response = await fetch(
      `${BACKEND_URL}/api/v1/intelligence/admin/test-run`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[admin/intelligence/test-run] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to trigger intelligence test run',
      },
      { status: 500 },
    );
  }
}
