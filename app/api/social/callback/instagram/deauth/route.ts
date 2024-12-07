import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { signed_request } = body

    if (!signed_request) {
      return NextResponse.json({ error: 'Missing signed request' }, { status: 400 })
    }

    // Decode the signed request
    const [encodedSig, payload] = signed_request.split('.')
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))

    // Delete the account from the database
    await prisma.account.deleteMany({
      where: {
        provider: 'instagram',
        providerAccountId: data.user_id.toString()
      }
    })

    return NextResponse.json({ message: 'Account disconnected successfully' })
  } catch (error) {
    console.error('Deauthorization error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 