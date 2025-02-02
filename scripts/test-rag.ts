import { RAGSystem } from "../app/lib/rag";
import type { AVADocumentType } from "../app/lib/rag";

async function testRAG() {
  const rag = new RAGSystem();
  
  // Test documents for each type
  const testDocs = [
    {
      type: 'current_persona' as AVADocumentType,
      content: "I am a content creator focused on tech reviews and AI education.",
    },
    {
      type: 'future_vision' as AVADocumentType,
      content: "In the next year, I want to expand into AI consulting and partnerships with tech companies.",
    },
    {
      type: 'conversation_history' as AVADocumentType,
      content: "User: How can I improve my content strategy?\nAssistant: Let's analyze your current performance and audience engagement.",
    },
    {
      type: 'smart_note' as AVADocumentType,
      content: "Key insights from today's partnership meeting:\n- Focus on AI-driven content\n- Explore collaboration opportunities\n- Schedule follow-up next week",
    },
    {
      type: 'insight' as AVADocumentType,
      content: "Analysis shows that AI-related content has 50% higher engagement than other topics.",
    },
    {
      type: 'partnership' as AVADocumentType,
      content: "Partnership opportunity with TechCorp for AI software review series.",
    },
    {
      type: 'content' as AVADocumentType,
      content: "How to Use ChatGPT for Content Creation - A Comprehensive Guide",
    },
    {
      type: 'email' as AVADocumentType,
      content: "Subject: Partnership Proposal\nFrom: partner@techcorp.com\n\nWe would like to explore a partnership opportunity for AI content creation.",
    }
  ];

  // Test documents for YouTube analysis
  const youtubeAnalysisDocs = [
    {
      type: 'insight' as AVADocumentType,
      content: `YouTube Audience Deep Analysis - Tech Channel:
- Core demographic: 25-34 year old professionals in tech industry
- 68% watch during commute hours (7-9am, 5-7pm)
- Highest engagement topics: AI tutorials (85% retention), Code reviews (78% retention)
- Unique insight: Viewers who watch AI content also frequently engage with entrepreneurship videos
- Competitive gap: Only 3% of tech channels combine AI education with business strategy
- Growth opportunity: 47% of comments ask for advanced AI implementation guides`,
    },
    {
      type: 'insight' as AVADocumentType,
      content: `Content-Audience Alignment Report:
1. Viewer Behavior Patterns:
   - 73% of subscribers watch within 4 hours of upload
   - Peak engagement occurs in first 15 minutes of videos
   - Most shared segments contain live coding or step-by-step tutorials
2. Audience Pain Points:
   - 42% struggle with implementing AI in real projects
   - 38% seek guidance on choosing right AI tools
   - 31% want business applications of AI technology`,
    },
    {
      type: 'insight' as AVADocumentType,
      content: `Audience Engagement Deep Dive:
Key Findings:
1. Comment Analysis:
   - 65% ask follow-up technical questions
   - 28% share personal project experiences
   - 15% request specific AI use cases
2. Retention Patterns:
   - Highest drop-off: Complex technical concepts without examples
   - Highest retention: Real-world application demonstrations
3. Community Behavior:
   - Active discussion threads average 45 replies
   - 37% of regular commenters are industry professionals
   - Growing demand for advanced AI implementation guides`,
    },
    {
      type: 'smart_note' as AVADocumentType,
      content: `Content Strategy Insights:
1. Audience Value Drivers:
   - Practical implementation examples
   - Industry expert perspectives
   - Career advancement insights
2. Content Gaps to Fill:
   - Advanced AI system architecture
   - Enterprise implementation guides
   - ROI analysis of AI adoption
3. Engagement Opportunities:
   - Live coding sessions with Q&A
   - Industry expert interviews
   - Case study breakdowns`,
    },
    {
      type: 'insight' as AVADocumentType,
      content: `Competitive Differentiation Analysis:
1. Market Position:
   - Only 5% of tech channels focus on practical AI implementation
   - Unique value: Combining technical depth with business context
2. Audience Needs Gap:
   - 72% seek advanced tutorials beyond basics
   - 58% want enterprise-focused content
3. Growth Vectors:
   - Enterprise AI implementation series
   - Industry-specific AI application guides
   - ROI-focused case studies`,
    }
  ];

  try {
    // Test document addition for each type
    console.log("Testing document addition for all types...");
    for (const doc of testDocs) {
      const metadata = {
        user_id: "test-user",
        timestamp: new Date().toISOString(),
        type: doc.type,
        analysis_type: "content",
        ...(doc.type === 'email' && {
          emailMetadata: {
            messageId: `test-${Date.now()}`,
            threadId: `thread-${Date.now()}`,
            subject: "Partnership Proposal",
            from: "partner@techcorp.com",
            to: ["team@avasetail.com"],
            date: new Date().toISOString(),
            isRead: false,
            isStarred: false,
            labels: ["INBOX", "PARTNERSHIP"]
          }
        })
      };

      console.log(`\nAdding ${doc.type} document...`);
      await rag.addDocument(doc.content, metadata);
      console.log(`${doc.type} document added successfully!`);
    }

    // Add YouTube analysis documents
    console.log("Adding YouTube analysis documents...");
    for (const doc of youtubeAnalysisDocs) {
      const metadata = {
        user_id: "test-user",
        timestamp: new Date().toISOString(),
        type: doc.type,
        analysis_type: "youtube_analysis",
        tags: ["youtube", "audience_insights", "content_strategy"]
      };

      await rag.addDocument(doc.content, metadata);
      console.log(`Added ${doc.type} document for YouTube analysis`);
    }

    // Test search functionality
    console.log("\nTesting search functionality...");
    
    // Test 1: Search for AI-related content
    console.log("\nTest 1: Searching for AI-related content...");
    const aiResults = await rag.search('content', "artificial intelligence");
    console.log("AI search results:", JSON.stringify(aiResults, null, 2));

    // Test 2: Search for partnership content
    console.log("\nTest 2: Searching for partnership content...");
    const partnershipResults = await rag.search('partnership', "partnership opportunity");
    console.log("Partnership search results:", JSON.stringify(partnershipResults, null, 2));

    // Test 3: Search with persona context
    console.log("\nTest 3: Searching with persona context...");
    const personaResults = await rag.searchWithPersonaContext("content strategy", "test-user");
    console.log("Persona context search results:", JSON.stringify(personaResults, null, 2));

    // Test targeted searches for content creator insights
    console.log("\nTesting YouTube analysis searches...");

    // Test 1: Audience behavior patterns
    console.log("\nTest 1: Analyzing audience behavior patterns...");
    const audienceBehaviorResults = await rag.search('insight', "viewer behavior patterns and engagement times");
    console.log("Audience behavior insights:", JSON.stringify(audienceBehaviorResults, null, 2));

    // Test 2: Content strategy recommendations
    console.log("\nTest 2: Finding content strategy recommendations...");
    const contentStrategyResults = await rag.search('smart_note', "content strategy and value drivers for audience");
    console.log("Content strategy insights:", JSON.stringify(contentStrategyResults, null, 2));

    // Test 3: Competitive advantage analysis
    console.log("\nTest 3: Analyzing competitive advantages...");
    const competitiveAnalysisResults = await rag.search('insight', "competitive differentiation and market position");
    console.log("Competitive analysis insights:", JSON.stringify(competitiveAnalysisResults, null, 2));

    // Test 4: Audience pain points and needs
    console.log("\nTest 4: Understanding audience pain points...");
    const audienceNeedsResults = await rag.search('insight', "audience pain points and needs in AI content");
    console.log("Audience needs insights:", JSON.stringify(audienceNeedsResults, null, 2));

  } catch (error) {
    console.error("Error during RAG testing:", error);
  }
}

testRAG().catch(console.error); 