import { NextResponse } from 'next/server';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  try {
    // Get API key from Authorization header if present
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '').trim();
    const body = await request.json();

    // Proxy the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/v1/smart-note/ideas/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Execution Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
