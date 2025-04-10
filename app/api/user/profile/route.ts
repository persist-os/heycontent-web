import { NextResponse } from "next/server"
import { auth } from "@/app/auth"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch user data
    const user = await convex.query(api.users.get, {
      userId: session.user.id
    })

    // Fetch persona data
    const persona = await convex.query(api.personas.getPersona, {
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      user: {
        name: user?.name || '',
        email: session.user.email || '',
      },
      persona: persona ? {
        name: persona.name,
        currentState: persona.currentState,
        currentActivities: persona.currentActivities,
        aspirations: persona.aspirations
      } : null
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch profile',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, currentPersona, futureVision } = await req.json()
    
    // Update user profile in Convex
    const user = await convex.mutation(api.users.update, {
      userId: session.user.id,
      name,
      email: session.user.email || '',
    })

    // Update persona in Convex
    if (currentPersona || futureVision) {
      await convex.mutation(api.personas.updatePersona, {
        userId: session.user.id,
        currentPersona: currentPersona || '',
        futureVision: futureVision || '',
      })
    }

    // Fetch the current persona
    const persona = await convex.query(api.personas.getPersona, {
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      user: {
        name: name || '',
        email: session.user.email || '',
      },
      persona: persona ? {
        name: persona.name,
        currentState: persona.currentState,
        currentActivities: persona.currentActivities,
        aspirations: persona.aspirations
      } : null
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update profile',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 