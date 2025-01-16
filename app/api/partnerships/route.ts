import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all partnerships for the user with proper typing
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        partnerships: {
          include: {
            contacts: true,
            history: true,
            requirements: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      active: user.partnerships.map((p) => ({
        ...p,
        progress: calculateProgress(p.requirements)
      }))
    })

  } catch (error) {
    console.error('[PARTNERSHIPS_ERROR]', error)
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function calculateProgress(requirements: any[]): number {
  if (!requirements?.length) return 0
  const completed = requirements.filter(r => r.completed).length
  return Math.round((completed / requirements.length) * 100)
} 