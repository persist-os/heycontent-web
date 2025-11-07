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
  // Project discovery endpoint has been removed
  return NextResponse.json(
    { error: 'Project discovery endpoint has been removed. Please use the thinking lab for project creation and editing.' },
    { status: 410 }
  )
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}


