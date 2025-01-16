import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { RAGSystem } from "@/lib/rag"

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
    
    // Update user profile in database
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        currentPersona,
        futureVision
      }
    })

    // Try to update RAG system, but don't block profile update if it fails
    if (currentPersona || futureVision) {
      try {
        const rag = new RAGSystem()
        await rag.updateUserPersona(
          session.user.id,
          currentPersona || '',
          futureVision
        )
        console.log('Profile update: RAG update successful');
      } catch (ragError) {
        // Log the error but don't throw it
        console.error('Profile update: RAG update failed (non-blocking):', ragError);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        currentPersona: user.currentPersona,
        futureVision: user.futureVision
      }
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