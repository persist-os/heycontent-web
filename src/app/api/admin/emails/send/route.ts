import { NextResponse } from 'next/server'
import { extractAuthInfo } from '@/app/lib/api-helpers-server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

/**
 * Send admin email
 * Pattern 1: Full-Stack API Call - Proxies to backend
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    const { apiKey } = extractAuthInfo(authHeader)

    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Call backend admin email endpoint
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/admin/emails/send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
      }
    )

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || 'Failed to send email' },
        { status: backendResponse.status }
      )
    }

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('[API Route Error] /api/admin/emails/send:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

