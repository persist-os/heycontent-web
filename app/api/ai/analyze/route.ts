import { NextResponse } from "next/server";
import { PlatformAgent } from "@/lib/agent";
import { RAGSystem } from "@/lib/rag";
import { auth } from "../../../auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query, context, type } = await req.json();
    
    const agent = new PlatformAgent();
    const rag = new RAGSystem();

    // Add user context
    const enrichedContext = {
      ...context,
      userId: session.user.id,
      type
    };

    // Process the query with the agent
    const result = await agent.process(query, enrichedContext);

    // Store the interaction for future context
    await rag.addDocument(
      JSON.stringify({ query, result }),
      {
        type: 'insight',
        category: 'interaction',
        user_id: session.user.id,
        timestamp: new Date().toISOString()
      }
    );

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
} 