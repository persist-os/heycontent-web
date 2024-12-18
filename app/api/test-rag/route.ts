import { NextResponse } from "next/server";
import { RAGSystem } from "@/lib/rag";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const startTime = Date.now();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, type = "test" } = await req.json();
    console.log('Received content:', content);

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    console.log('Initializing RAG system...');
    const rag = new RAGSystem();
    console.log('RAG system initialized successfully');

    // Log environment variables (without sensitive values)
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    });

    // Test 1: Add a document
    console.log('Test 1: Adding document...');
    const addStartTime = Date.now();
    await rag.addDocument(content, {
      type: 'smart_note',
      user_id: session.user.id,
      timestamp: new Date().toISOString(),
      tags: ["test"]
    });
    const addEndTime = Date.now();
    console.log('Document added successfully');

    // Test 2: Search for the added content
    console.log('Test 2: Searching for added content...');
    const searchStartTime = Date.now();
    const searchResults = await rag.search(content, { 
      type: 'smart_note',
      user_id: session.user.id
    }, 5);
    const searchEndTime = Date.now();
    console.log('Search results:', {
      count: searchResults.length,
      results: searchResults.map(doc => ({
        content: doc.pageContent.substring(0, 100) + '...',
        metadata: doc.metadata,
        similarity: doc.metadata.similarity || 0
      }))
    });

    // Test 3: Add and retrieve content with specific metadata
    console.log('Test 3: Testing metadata filtering...');
    const metadataStartTime = Date.now();
    await rag.addDocument(content, {
      type: 'smart_note',
      user_id: session.user.id,
      timestamp: new Date().toISOString(),
      tags: ["test", "metadata"]
    });
    const metadataResults = await rag.search(content, { 
      type: 'smart_note',
      user_id: session.user.id,
      tags: ["test", "metadata"]
    }, 5);
    const metadataEndTime = Date.now();
    console.log('Metadata search results:', {
      count: metadataResults.length,
      results: metadataResults.map(doc => ({
        content: doc.pageContent.substring(0, 100) + '...',
        metadata: doc.metadata,
        similarity: doc.metadata.similarity || 0
      }))
    });

    const endTime = Date.now();

    return NextResponse.json({
      success: true,
      tests: {
        smartNoteTest: {
          added: true,
          timing: {
            add: addEndTime - addStartTime,
            search: searchEndTime - searchStartTime
          },
          searchResults: {
            count: searchResults.length,
            samples: searchResults.map(doc => ({
              contentPreview: doc.pageContent.substring(0, 100) + '...',
              metadata: doc.metadata,
              similarity: doc.metadata.similarity || 0
            })).slice(0, 3) // Return top 3 results
          }
        },
        metadataTest: {
          added: true,
          timing: {
            total: metadataEndTime - metadataStartTime
          },
          searchResults: {
            count: metadataResults.length,
            samples: metadataResults.map(doc => ({
              contentPreview: doc.pageContent.substring(0, 100) + '...',
              metadata: doc.metadata,
              similarity: doc.metadata.similarity || 0
            })).slice(0, 3) // Return top 3 results
          }
        }
      },
      debug: {
        totalTime: endTime - startTime,
        contentLength: content.length,
        vectorDimensions: 1536, // OpenAI embedding size
        environment: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('RAG test error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
        debug: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
} 