import { NextResponse } from 'next/server'

// Why this route exists:
// - Proxies natural-language "Quick fill" requests to the backend extraction pipeline
// - Uses the same discovery/extraction logic and prompt already in the backend
// Contract:
// - Suggestions only. This route NEVER writes to Convex; the edit page decides what to apply
// Auth & proxy rules:
// - Client should call with Authorization: Bearer <apiKey> (see `fetchWithApiKey` helper)
// - We forward that header as-is to backend
// Env migration:
// - Prefer BACKEND_URL (server-side) over NEXT_PUBLIC_BACKEND_URL; keep fallback during migration

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL

interface QuickFillBody {
  projectId: string
  userId: string
  text: string
}

export async function POST(request: Request) {
  try {
    // Validate JSON body
    let body: QuickFillBody | null = null
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const projectId = typeof body?.projectId === 'string' ? body.projectId.trim() : ''
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : ''
    const text = typeof body?.text === 'string' ? body.text.trim() : ''

    if (!projectId || !userId || !text) {
      return NextResponse.json(
        { error: 'projectId, userId, and text are required' },
        { status: 400 }
      )
    }

    if (!BACKEND_URL) {
      return NextResponse.json({ error: 'Backend URL not configured' }, { status: 500 })
    }

    // Forward to backend discovery/extraction pipeline as a suggest-only operation
    // Mirror proxy patterns: forward Authorization header; JSON body
    const authHeader = request.headers.get('Authorization') || ''
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 })
    }
    const headersToSend: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader
    }

    // Backend expects the discovery-style contract; we reuse that pipeline
    const payload = {
      user_id: userId,
      query: text,
      // Provide project context so extraction can reference correct project
      content_context: { project_id: projectId },
      // Signal this is a suggest-only extraction. Backend should avoid writes when present.
      suggest_only: true
    }

    const resp = await fetch(`${BACKEND_URL}/api/v1/project-discovery`, {
      method: 'POST',
      headers: headersToSend,
      body: JSON.stringify(payload)
    })

    // Try to parse JSON either way to surface backend details
    let backendJson: any = null
    try {
      backendJson = await resp.clone().json()
    } catch {
      // non-JSON backend response
    }

    if (!resp.ok) {
      // Propagate concise upstream error
      const status = resp.status >= 500 ? 502 : resp.status
      const message = backendJson?.error || backendJson?.detail || resp.statusText || 'Upstream error'
      return NextResponse.json({ error: message }, { status })
    }

    // Normalize to { updates, confidence?, metadata? }
    // Backend suggest-only mode returns field updates under metadata.field_updates (array of { field, value, ... })
    const metadata = backendJson?.metadata || {}
    const fieldUpdates = Array.isArray(metadata?.field_updates) ? metadata.field_updates : []
    const updates: Record<string, any> = fieldUpdates.reduce((acc: Record<string, any>, u: any) => {
      const key = typeof u?.field === 'string' ? u.field : null
      if (key) acc[key] = u?.value
      return acc
    }, {})
    const confidence = backendJson?.confidence

    return NextResponse.json({ updates, confidence, metadata })
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : 'Internal error'
    return NextResponse.json(
      {
        error: message
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}


