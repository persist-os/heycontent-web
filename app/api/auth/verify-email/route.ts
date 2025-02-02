import { NextResponse } from "next/server"
import prisma from "@/app/lib/prisma"
import crypto from "crypto"
import { sendVerificationEmail } from "@/app/lib/email"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, a verification email has been sent." },
        { status: 200 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      )
    }

    // Generate new verification token
    const verifyToken = crypto.randomBytes(32).toString('hex')
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verifyToken,
        verifyTokenExpiry,
      },
    })

    await sendVerificationEmail(email, verifyToken)

    return NextResponse.json({ 
      message: "Verification email sent" 
    })
  } catch (error) {
    console.error('Send verification error:', error)
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    )
  }
} 