import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import crypto from "crypto"
import { sendPasswordResetEmail } from "../../../../src/lib/email"

// Request password reset
export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Return success even if user doesn't exist (security)
      return NextResponse.json({ 
        message: "If an account exists, you will receive a reset email" 
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

    // Save to database
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Send reset email
    await sendPasswordResetEmail(email, resetToken)

    return NextResponse.json({ 
      message: "If an account exists, you will receive a reset email" 
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

// Reset password with token
export async function PUT(req: Request) {
  try {
    const { token, password } = await req.json()

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    })

    return NextResponse.json({ 
      message: "Password successfully reset" 
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
} 