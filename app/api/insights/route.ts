export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '../../../app/auth'
import { prisma } from '@/lib/db'
import { actionableInsights } from '@/data/insights'  // Import mock data

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Return mock data for now
    return NextResponse.json(actionableInsights)

    // TODO: Later we'll use real data from prisma:
    // const insights = await prisma.insight.findMany({
    //   where: { userId: session.user.id },
    //   orderBy: { confidence: 'desc' }
    // })
  } catch (error) {
    console.error('[INSIGHTS_ERROR]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 