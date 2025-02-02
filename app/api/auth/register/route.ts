import { hash } from "bcryptjs"
import { NextResponse } from "next/server"
import prisma from "@/app/lib/prisma"
import { z } from "zod"
import crypto from "crypto"
import { sendVerificationEmail } from "../../../../src/lib/email"

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, name } = result.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // Always return the same message for security
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      )
    }

    // Generate verification token first
    const verifyToken = crypto.randomBytes(32).toString('hex')
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    const hashedPassword = await hash(password, 10)

    // Create user with verification required
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        verifyToken,
        verifyTokenExpiry,
        emailVerified: null, // Explicitly set as unverified
      }
    })

    // Send verification email immediately
    await sendVerificationEmail(email, verifyToken)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: "Registration successful. Please check your email to verify your account."
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    )
  }
} 