import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

type ValidStatus = 'new' | 'in_progress' | 'completed' | 'cancelled'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { status } = body as { status: ValidStatus }

    if (!status || !['new', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Verify partnership belongs to user and update in one transaction
    const result = await prisma.$transaction(async (tx) => {
      const partnership = await tx.partnership.findFirst({
        where: {
          id: params.id,
          userId: session.user.id
        }
      })

      if (!partnership) {
        throw new Error('Partnership not found')
      }

      const updated = await tx.partnership.update({
        where: { id: params.id },
        data: { 
          status,
          lastUpdated: new Date()
        }
      })

      await tx.partnershipEvent.create({
        data: {
          partnershipId: params.id,
          date: new Date().toISOString(),
          event: `Status changed to ${status}`,
          notes: `Updated by ${session.user.name || session.user.email}`
        }
      })

      return updated
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('[PARTNERSHIP_STATUS_ERROR]', error)
    if (error instanceof Error && error.message === 'Partnership not found') {
      return NextResponse.json({ error: 'Partnership not found' }, { status: 404 })
    }
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 