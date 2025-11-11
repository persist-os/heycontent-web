import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

/**
 * GET /api/platforms/gmail/auth
 * 
 * Proxy to backend Gmail auth endpoint.
 * Returns Gmail OAuth authorization URL with user_id encoded in state.
 */
export async function GET(request: NextRequest) {
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('Authorization') || ''
    const bearerPrefix = 'Bearer '
    const apiKey = authHeader.startsWith(bearerPrefix)
      ? authHeader.slice(bearerPrefix.length).trim()
      : ''

    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract return_url from query params (current page URL)
    const { searchParams } = new URL(request.url)
    const returnUrl = searchParams.get('return_url') || null

    // Build backend URL with return_url if provided
    const backendUrl = new URL(`${BACKEND_URL}/gmail/auth`)
    if (returnUrl) {
      backendUrl.searchParams.set('return_url', returnUrl)
    }

    // Forward to backend Gmail auth endpoint
    const backendResponse = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!backendResponse.ok) {
      const error = await backendResponse.json()
      return NextResponse.json(
        { error: error.detail || 'Failed to get Gmail auth URL' },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in Gmail auth API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

