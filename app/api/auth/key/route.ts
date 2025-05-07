import { NextResponse } from 'next/server';

import { proxyApiKeyRequest } from '../utils/apiKeyProxy';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken, userId } = body;
    const result = await proxyApiKeyRequest({ idToken, userId });
    if (result && result.status && result.status !== 200) {
      return NextResponse.json(result, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
