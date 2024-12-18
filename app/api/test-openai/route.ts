import { NextResponse } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai";

export async function GET() {
  try {
    // Log environment state
    console.log('Environment check:', {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length,
      keyStart: process.env.OPENAI_API_KEY?.substring(0, 10),
    });

    // Test OpenAI embeddings directly
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Try to embed a simple text
    const result = await embeddings.embedQuery("test");

    return NextResponse.json({
      success: true,
      dimensions: result.length,
      sample: result.slice(0, 5),
      environment: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY?.length,
      }
    });
  } catch (error) {
    console.error('OpenAI test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY?.length,
      }
    }, { status: 500 });
  }
} 