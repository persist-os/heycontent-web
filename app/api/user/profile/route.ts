import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { z } from "zod"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  currentPersona: z.string().optional(),
  futureVision: z.string().optional(),
})

export async function PUT(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    console.log('Received update:', body)

    const result = profileSchema.safeParse(body)

    if (!result.success) {
      console.log('Validation error:', result.error)
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, currentPersona, futureVision } = result.data

    const updatedUser = await prisma.user.update({
      where: { 
        id: session.user.id 
      },
      data: {
        name,
        currentPersona,
        futureVision,
      },
      select: {
        id: true,
        name: true,
        email: true,
        currentPersona: true,
        futureVision: true,
      }
    })

    console.log('Updated user:', updatedUser)

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
} 