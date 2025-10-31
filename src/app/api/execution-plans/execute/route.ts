/**
 * Execute Plan API Route
 * 
 * Thin wrapper forwarding to backend.
 * Follows existing API route patterns.
 */

import { NextResponse } from 'next/server'
import { extractAuthInfo } from '@/app/lib/api-helpers-server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export async function POST(request: Request) {
  try {
    // Extract auth
    const authHeader = request.headers.get('Authorization')
    const { apiKey } = extractAuthInfo(authHeader)
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Forward to backend
    const response = await fetch(`${BACKEND_URL}/api/v1/execution-plans/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to execute plan' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('[ExecutionPlan] Execute route error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

