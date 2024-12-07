import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import type { Partnership as PrismaPartnership } from '@prisma/client'

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
          },
          orderBy: {
            lastUpdated: 'desc'
          }
        },
        incomingProposals: {
          where: {
            status: 'pending'
          },
          orderBy: {
            receivedDate: 'desc'
          }
        },
        suggestedPartnerships: {
          where: {
            status: 'new'
          },
          orderBy: {
            confidence: 'desc'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      active: user.partnerships.map((p: PrismaPartnership & { requirements: any[] }) => ({
        ...p,
        progress: calculateProgress(p.requirements)
      })),
      incoming: user.incomingProposals,
      suggested: user.suggestedPartnerships
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