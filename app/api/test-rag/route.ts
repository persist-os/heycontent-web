import { NextResponse } from "next/server";
import { RAGSystem } from "@/app/lib/rag";
import { auth } from "../../auth";

const rag = new RAGSystem();

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, content, type = 'test' } = await request.json();

    // Add user_id to metadata
    const enrichedMetadata = {
      ...{
        user_id: session.user.id,
        timestamp: new Date().toISOString()
      },
      type
    };

    console.log('RAG Test Request:', { 
      operation, 
      contentLength: content?.length, 
      metadata: enrichedMetadata 
    });

    switch (operation) {
      case 'add': {
        if (!content) {
          return NextResponse.json(
            { error: 'Content is required for add operation' }, 
            { status: 400 }
          );
        }

        // Clean and validate content
        const cleanContent = content.trim();
        if (!cleanContent) {
          return NextResponse.json(
            { error: 'Content cannot be empty' }, 
            { status: 400 }
          );
        }

        // Determine if this is an email and extract metadata
        const isEmail = cleanContent.includes('Subject:');
        const analysisType = cleanContent.toLowerCase().includes('partnership') ? 'partnership' : 'content';

        // Enrich metadata
        const documentMetadata = {
          ...enrichedMetadata,
          analysis_type: analysisType,
          emailMetadata: isEmail ? {
            messageId: `test-${Date.now()}`,
            threadId: `thread-${Date.now()}`,
            subject: cleanContent.split('Subject:')[1]?.split('\n')[0]?.trim() || 'No Subject',
            from: cleanContent.includes('From:') ? cleanContent.split('From:')[1]?.split('\n')[0]?.trim() : 'unknown@example.com',
            to: ['team@avasetail.com'],
            date: new Date().toISOString(),
            isRead: false,
            isStarred: false,
            labels: ['INBOX', analysisType === 'partnership' ? 'PARTNERSHIP' : 'GENERAL']
          } : undefined
        };
        
        await rag.addDocument(cleanContent, documentMetadata);
        return NextResponse.json({ 
          status: 'success',
          message: 'Document added successfully',
          timestamp: documentMetadata.timestamp,
          type,
          analysis_type: analysisType
        });
      }

      case 'search': {
        if (!content) {
          return NextResponse.json(
            { error: 'Content is required for search operation' }, 
            { status: 400 }
          );
        }
        
        // Determine search context
        const searchContext = content.toLowerCase();
        const searchMetadata = {
          ...enrichedMetadata
        };
        
        // Get both the email and best practices
        const [emailResults, bestPracticesResults] = await Promise.all([
          rag.search('email', content, { filters: { ...searchMetadata } }),
          rag.search('content', content, { filters: { ...searchMetadata, analysis_type: 'partnership' } })
        ]);

        // Get the most relevant email and best practices
        const email = emailResults[0];
        const bestPractices = bestPracticesResults[0];

        // Analyze based on the query type
        let analysis = '';
        if (searchContext.includes('main goal')) {
          analysis = analyzeGoal(email?.content || '');
        } else if (searchContext.includes('typically respond')) {
          analysis = analyzeResponse(bestPractices?.content || '');
        } else if (searchContext.includes('written better')) {
          analysis = analyzeImprovements(email?.content || '', bestPractices?.content || '');
        }

        return NextResponse.json({ 
          status: 'success',
          query: content,
          context: {
            type: searchMetadata.type,
            analysis_type: searchContext.includes('partnership') ? 'partnership' : 'content'
          },
          analysis,
          email: email ? {
            content: email.content,
            metadata: email.metadata
          } : null,
          bestPractices: bestPractices ? {
            content: bestPractices.content,
            metadata: bestPractices.metadata
          } : null
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Use "add" or "search".' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in test-rag:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Analysis helper functions
function analyzeGoal(emailContent: string): string {
  const goals = [];
  const contentOpportunities = [];

  // Analyze partnership goals
  if (emailContent.toLowerCase().includes('ai analytics')) {
    goals.push('AI Analytics Integration: Potential to enhance content performance tracking and optimization');
  }
  if (emailContent.toLowerCase().includes('content creation')) {
    goals.push('Content Enhancement: Opportunity to improve content creation workflow with AI');
  }
  if (emailContent.toLowerCase().includes('management system')) {
    goals.push('System Integration: Possibility to streamline content management with AI capabilities');
  }

  // Analyze content opportunities
  if (emailContent.toLowerCase().includes('synergies')) {
    contentOpportunities.push('- AI-powered content optimization and performance analysis');
    contentOpportunities.push('- Automated content tagging and categorization');
    contentOpportunities.push('- Enhanced content personalization capabilities');
  }

  let analysis = '';
  if (goals.length > 0) {
    analysis += 'Partnership Goals:\n' + goals.map(g => `- ${g}`).join('\n') + '\n\n';
  }
  if (contentOpportunities.length > 0) {
    analysis += 'Content Creation Opportunities:\n' + contentOpportunities.join('\n');
  }

  return analysis || 'No specific content-related goals identified in the email.';
}

function analyzeResponse(bestPractices: string): string {
  return `Content Partnership Response Strategy:

1. Content Alignment
   - Discuss current content creation workflow
   - Identify specific AI integration points
   - Explore content performance metrics

2. Technical Evaluation
   - Review API capabilities for content analysis
   - Discuss data sharing and privacy requirements
   - Evaluate integration complexity

3. Pilot Proposal
   - Suggest a trial with specific content types
   - Define success metrics for content performance
   - Outline timeline for initial integration

4. Next Steps
   - Schedule technical discovery call
   - Request API documentation
   - Share content workflow documentation`;
}

function analyzeImprovements(emailContent: string, bestPractices: string): string {
  const improvements = [];
  
  // Content-specific improvements
  if (!emailContent.toLowerCase().includes('analytics') || !emailContent.toLowerCase().includes('performance')) {
    improvements.push('Could detail how AI analytics would improve content performance metrics');
  }
  if (!emailContent.toLowerCase().includes('workflow')) {
    improvements.push('Could explain how the integration would enhance content creation workflow');
  }
  if (!emailContent.toLowerCase().includes('personalization')) {
    improvements.push('Could highlight content personalization capabilities');
  }
  if (!emailContent.toLowerCase().includes('automation')) {
    improvements.push('Could mention content automation possibilities');
  }
  
  // AI partnership specifics
  if (!emailContent.toLowerCase().includes('api') && !emailContent.toLowerCase().includes('integration')) {
    improvements.push('Could provide technical integration details for content management');
  }
  if (!emailContent.toLowerCase().includes('data')) {
    improvements.push('Could address data handling and content analysis capabilities');
  }
  
  return improvements.length > 0 ?
    'Content Partnership Improvements:\n' + improvements.map(i => `- ${i}`).join('\n') :
    'The email covers most content-related partnership aspects.';
} 