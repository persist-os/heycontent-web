import { NextResponse } from "next/server";
import { RAGSystem } from "@/lib/rag";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPersona, futureVision } = await req.json();
    
    if (!currentPersona) {
      return NextResponse.json(
        { error: 'Current persona is required' },
        { status: 400 }
      );
    }

    const rag = new RAGSystem();
    const startTime = Date.now();

    // Update persona
    await rag.updateUserPersona(
      session.user.id,
      currentPersona,
      futureVision
    );

    // Retrieve updated persona
    const persona = await rag.getUserPersona(session.user.id);

    // Test search with persona context
    const testQuery = "What content should I create next?";
    const searchResults = await rag.searchWithPersonaContext(
      testQuery,
      session.user.id
    );

    const endTime = Date.now();

    return NextResponse.json({
      success: true,
      persona: {
        current: persona.currentPersona,
        future: persona.futureVision,
        timestamp: persona.timestamp
      },
      test: {
        query: testQuery,
        results: searchResults.map(doc => ({
          content: doc.pageContent.substring(0, 100) + '...',
          metadata: doc.metadata
        })).slice(0, 3)
      },
      timing: {
        total: endTime - startTime
      }
    });
  } catch (error) {
    console.error('Persona test error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 