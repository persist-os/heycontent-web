import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import prisma from '@/app/lib/prisma'
import type { PrismaClient, Prisma } from '@prisma/client'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Verify partnership belongs to user and update in one transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const partnership = await tx.partnership.findFirst({
        where: {
          id: params.id,
          OR: [
            { userId: session.user.id },
            { proposedToId: session.user.id },
            { suggestedToId: session.user.id }
          ]
        }
      })

      if (!partnership) {
        throw new Error('Partnership not found')
      }

      const updated = await tx.partnership.update({
        where: { id: params.id },
        data: { 
          status,
          updatedAt: new Date()
        }
      })

      await tx.partnershipEvent.create({
        data: {
          partnershipId: params.id,
          date: new Date(),
          type: 'STATUS_CHANGE',
          description: `Status changed to ${status}`
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 