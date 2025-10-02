import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the file path from the URL
    const filePath = params.path.join('/')
    
    // Get the API key from the request headers
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Forward the request to the backend
    const backendUrl = `${BACKEND_URL}/api/v1/files/serve/${filePath}`
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': '*/*'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'File not found or access denied' }, 
        { status: response.status }
      )
    }

    // Get the file content and content type
    const fileContent = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentDisposition = response.headers.get('content-disposition')

    // Return the file with appropriate headers
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition || 'inline',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      }
    })

  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
