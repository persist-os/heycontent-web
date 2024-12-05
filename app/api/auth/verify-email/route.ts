import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import crypto from "crypto"
import { sendVerificationEmail } from "@/lib/email"
import { redirect } from "next/navigation"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const verifyToken = crypto.randomBytes(32).toString('hex')
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.user.update({
      where: { email },
      data: {
        verifyToken,
        verifyTokenExpiry
      }
    })

    await sendVerificationEmail(email, verifyToken)

    return NextResponse.json({ 
      message: "Verification email sent" 
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const { token } = await req.json()

    const user = await prisma.user.findFirst({
      where: {
        verifyToken: token,
        verifyTokenExpiry: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verifyToken: null,
        verifyTokenExpiry: null
      }
    })

    redirect('/verify-email/success')

    return NextResponse.json({ 
      message: "Email verified successfully" 
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
} 