import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

/**
 * POST /api/v1/artifacts/export
 * 
 * Proxy to backend artifact export endpoint.
 * Handles file downloads (PDF, CSV, JSON, Markdown, Excel, EML).
 * 
 * Pattern: PT:1 (Full-Stack API), L:II (API Integration)
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()

    // Forward to backend artifact export endpoint
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/artifacts/export`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ detail: 'Unknown error' }))
      return NextResponse.json(
        { error: error.detail || error.error || 'Export failed' },
        { status: backendResponse.status }
      )
    }

    // Get file content as blob (binary data)
    const blob = await backendResponse.blob()
    
    // Get content type and filename from backend response headers
    const contentType = backendResponse.headers.get('Content-Type') || 'application/octet-stream'
    const contentDisposition = backendResponse.headers.get('Content-Disposition') || ''
    
    // Extract filename from Content-Disposition header
    let filename = `artifact_${body.artifactId || 'export'}.${body.format || 'file'}`
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
    if (filenameMatch) {
      filename = filenameMatch[1]
    }

    // Return file download response
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition || `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Error in artifact export API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

