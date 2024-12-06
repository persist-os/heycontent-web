import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  try {
    const token = params.token
    console.log('Verifying token:', token)

    const user = await prisma.user.findFirst({
      where: {
        verifyToken: token,
        verifyTokenExpiry: {
          gt: new Date(),
        },
      },
    })

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          verifyToken: null,
          verifyTokenExpiry: null,
        },
      })
      
      return NextResponse.redirect(`${baseUrl}/verify-email/success`)
    }

    console.log('No user found with token')
    return NextResponse.redirect(`${baseUrl}/verify-email?error=invalid-token`)
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.redirect(`${baseUrl}/verify-email?error=server-error`)
  }
} 