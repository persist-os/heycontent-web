import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    const filePath = params.path.join('/')
    
    // Get API key - try Authorization header first, then cookies
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization') || '';
    let apiKey = authHeader.startsWith('Bearer ') 
      ? authHeader.slice('Bearer '.length).trim() 
      : '';
    
    // Browser requests (img/video tags) use cookies, not headers
    if (!apiKey) {
      const cookieStore = await cookies()
      const apiKeyCookie = cookieStore.get('apiKey')
      if (apiKeyCookie) {
        try {
          apiKey = JSON.parse(apiKeyCookie.value)
        } catch {
          apiKey = apiKeyCookie.value
        }
      }
    }
    
    if (!apiKey) {
      console.warn(`[${requestId}] File serve: No authentication for ${filePath}`)
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log(`[${requestId}] Serving file: ${filePath}`)

    // Forward to backend
    const backendUrl = `${BACKEND_URL}/api/v1/files/serve/${filePath}`
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': '*/*'
      }
    })

    if (!response.ok) {
      console.error(`[${requestId}] Backend error: ${response.status} for ${filePath}`)
      return NextResponse.json(
        { error: 'File not found or access denied' }, 
        { status: response.status }
      )
    }

    // Stream file with proper headers
    const fileContent = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentDisposition = response.headers.get('content-disposition')

    console.log(`[${requestId}] File served successfully: ${filePath}`)

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition || 'inline',
        'Cache-Control': 'public, max-age=3600',
      }
    })

  } catch (error) {
    console.error(`[${requestId}] Error serving file:`, error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
