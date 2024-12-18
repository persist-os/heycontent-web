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

    // Update persona in RAG system if persona fields are provided
    if (currentPersona || futureVision) {
      console.log('Initializing RAG system with env vars:', {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openAIKeyLength: process.env.OPENAI_API_KEY?.length
      });

      const rag = new RAGSystem()
      await rag.updateUserPersona(
        session.user.id,
        currentPersona || '',  // Pass empty string if not provided
        futureVision          // Optional
      )
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
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openAIKeyLength: process.env.OPENAI_API_KEY?.length
      }
    })
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update profile',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 