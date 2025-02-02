import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { google } from 'googleapis';
import { validateToken } from '@/app/lib/auth-helpers';
import prisma from '@/app/lib/prisma';
import { gmail_v1 } from 'googleapis';
import OpenAI from 'openai';
import { selectModel } from '@/app/lib/openai';
import { RAGSystem } from '@/app/lib/rag';
import { SocialMediaService } from '@/app/lib/services/social-media';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface PartnershipAnalysis {
  insights: {
    summary: string;
    opportunities: string[];
    recommendations: string[];
  };
  contentIdeas: string[];
  metrics: {
    responseRate: number;
    averageResponseTime: number;
    successfulPartnerships: number;
    pendingOpportunities: number;
  };
  categories: {
    [key: string]: {
      count: number;
      examples: string[];
    };
  };
}

interface EmailData {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  labels: string[];
  threadId: string;
}

interface AnalysisResponse {
  insights: {
    summary: string;
    opportunities: string[];
    recommendations: string[];
  };
  contentIdeas: string[];
  categories: {
    [key: string]: {
      count: number;
      examples: string[];
    };
  };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { query } = body; // Optional query for specific analysis

    // Get user's Gmail account
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        socialAccounts: {
          where: { 
            platform: 'gmail',
            isConnected: true
          }
        }
      }
    });

    const gmailAccount = user?.socialAccounts[0];
    if (!gmailAccount) {
      return NextResponse.json({ error: 'Gmail account not connected' }, { status: 400 });
    }

    // Initialize Gmail API
    const accessToken = await validateToken(session.user.id, 'gmail');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get partnership emails from the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const searchQuery = `after:${Math.floor(ninetyDaysAgo.getTime() / 1000)} (
      subject:(partnership OR sponsor OR collab OR influencer OR brand OR deal OR 
      collaboration OR sponsorship OR affiliate OR commission OR paid OR promotion OR 
      campaign OR ambassador OR monetization OR revenue OR earnings OR marketing OR 
      business OR proposal OR opportunity OR contract OR payment OR invoice OR giveaway)
    )`;
    
    // Fetch messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: searchQuery,
      maxResults: 100
    });
    
    const messages = response.data.messages || [];
    
    // Get detailed message content
    const messageDetails = await Promise.all(
      messages.map(async (msg) => {
        const details = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full'
        });
        return details.data;
      })
    );

    // Extract email content and metadata
    const emailData: EmailData[] = messageDetails.map(msg => {
      const getHeader = (name: string) => 
        msg.payload?.headers?.find(h => h.name === name)?.value || '';
      
      // Decode email body
      let body = '';
      if (msg.payload?.parts?.[0]?.body?.data) {
        body = Buffer.from(msg.payload.parts[0].body.data, 'base64').toString();
      } else if (msg.payload?.body?.data) {
        body = Buffer.from(msg.payload.body.data, 'base64').toString();
      }

      const emailData: EmailData = {
        id: msg.id || '',
        subject: getHeader('Subject'),
        from: getHeader('From'),
        to: getHeader('To'),
        date: getHeader('Date'),
        body,
        labels: msg.labelIds || [],
        threadId: msg.threadId || ''
      };
      
      return emailData;
    });

    // Group emails by thread for conversation context
    const emailThreads = emailData.reduce<Record<string, EmailData[]>>((acc, email) => {
      const threadId = email.threadId;
      if (!threadId) return acc;
      
      if (!acc[threadId]) {
        acc[threadId] = [];
      }
      acc[threadId].push(email);
      return acc;
    }, {});

    // Handle specific partnership analysis
    if (query && query.includes('partnership:')) {
      const partnerName = query.split('partnership:')[1].trim();
      const relevantThreads = Object.values(emailThreads).filter(thread => 
        thread.some(email => 
          email.subject.toLowerCase().includes(partnerName.toLowerCase()) ||
          email.body.toLowerCase().includes(partnerName.toLowerCase())
        )
      );

      if (relevantThreads.length === 0) {
        return NextResponse.json({
          error: `No emails found related to partnership with "${partnerName}"`
        }, { status: 404 });
      }

      const partnershipPrompt = `Analyze this specific partnership with ${partnerName}. 
      Provide insights in the following JSON format:
      {
        "partnershipDetails": {
          "status": "active/pending/completed",
          "summary": "Summary of the partnership",
          "timeline": ["Key events and dates"],
          "nextSteps": ["Suggested next steps"],
          "keyPoints": ["Important points from the conversation"]
        },
        "contentSuggestions": {
          "followUpEmail": "Draft of a follow-up email if needed",
          "contentIdeas": ["Content ideas specific to this partnership"],
          "improvements": ["Suggested improvements for the partnership"]
        },
        "analysis": {
          "strengths": ["Partnership strengths"],
          "challenges": ["Partnership challenges"],
          "opportunities": ["Growth opportunities"]
        }
      }

      Conversation history: ${JSON.stringify(relevantThreads.map(thread => 
        thread.map(email => ({
          date: email.date,
          from: email.from,
          to: email.to,
          subject: email.subject,
          body: email.body.substring(0, 1000),
          type: email.labels.includes('SENT') ? 'outgoing' : 'incoming'
        }))
      ))}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [{
          role: "system",
          content: "You are an expert partnership manager. Analyze this specific partnership and provide detailed insights and suggestions."
        }, {
          role: "user",
          content: partnershipPrompt
        }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      try {
        const content = completion.choices[0].message.content;
        if (!content) {
          throw new Error('No content in OpenAI response');
        }
        return NextResponse.json(JSON.parse(content));
      } catch (error) {
        console.error('Error parsing partnership analysis:', error);
        return NextResponse.json({
          error: 'Failed to analyze partnership'
        }, { status: 500 });
      }
    }

    // Handle content generation requests
    if (query && query.includes('generate:')) {
      const contentType = query.split('generate:')[1].trim();
      const contentPrompt = `Generate ${contentType} based on our partnership emails.
      Consider our tone, style, and previous successful communications.
      
      Recent communications: ${JSON.stringify(emailData.slice(0, 10).map(e => ({
        subject: e.subject,
        body: e.body.substring(0, 500)
      })))}`;

      const completion = await openai.chat.completions.create({
        model: selectModel('medium'),
        messages: [{
          role: "system",
          content: "You are an expert content creator specializing in partnership communications."
        }, {
          role: "user",
          content: contentPrompt
        }],
        temperature: 0.7
      });

      return NextResponse.json({
        generated_content: completion.choices[0].message.content
      });
    }

    // Analyze partnerships using OpenAI
    const analysisPrompt = `Analyze these partnership-related emails and provide insights in the following JSON format:
    {
      "insights": {
        "summary": "A brief summary of overall partnership activity",
        "opportunities": ["List of identified opportunities"],
        "recommendations": ["List of actionable recommendations"]
      },
      "contentIdeas": ["List of content ideas based on successful partnerships"],
      "categories": {
        "categoryName": {
          "count": 0,
          "examples": ["Example partnerships in this category"]
        }
      }
    }

    Focus on:
    1. Identify key partnership opportunities and their status
    2. Suggest content ideas and collaboration strategies
    3. Identify patterns in successful partnerships
    4. Recommend improvements and next steps
    5. Categorize partnerships by type and potential
    
    Additional context: ${query || 'Provide general partnership insights'}
    
    Analyze these emails: ${JSON.stringify(emailData.map(e => ({
      subject: e.subject,
      body: e.body.substring(0, 1000), // Limit body length
      date: e.date,
      type: e.labels.includes('SENT') ? 'outgoing' : 'incoming',
      status: e.labels.includes('UNREAD') ? 'pending' : 'replied'
    })))}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [{
        role: "system",
        content: "You are an expert partnership manager and business strategist. Analyze partnership emails and provide actionable insights. ALWAYS respond with valid JSON matching the specified format."
      }, {
        role: "user",
        content: analysisPrompt
      }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    let analysis: AnalysisResponse;
    try {
      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }
      const parsedContent = JSON.parse(content) as AnalysisResponse;
      analysis = {
        insights: {
          summary: parsedContent.insights?.summary || "Analysis completed",
          opportunities: parsedContent.insights?.opportunities || [],
          recommendations: parsedContent.insights?.recommendations || []
        },
        contentIdeas: parsedContent.contentIdeas || [],
        categories: parsedContent.categories || {}
      };
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.log('Raw response:', completion.choices[0].message.content);
      analysis = {
        insights: {
          summary: "Analysis completed but encountered formatting issues",
          opportunities: [],
          recommendations: []
        },
        contentIdeas: [],
        categories: {}
      };
    }

    // Calculate metrics
    const metrics = {
      responseRate: emailData.filter(e => e.labels.includes('SENT')).length / emailData.length,
      averageResponseTime: 0, // TODO: Calculate from thread timestamps
      successfulPartnerships: emailData.filter(e => 
        e.subject.toLowerCase().includes('contract') || 
        e.subject.toLowerCase().includes('agreement')
      ).length,
      pendingOpportunities: emailData.filter(e => 
        e.labels.includes('UNREAD') || 
        !e.labels.includes('SENT')
      ).length
    };

    const result: PartnershipAnalysis = {
      insights: analysis.insights || {
        summary: "Analysis completed",
        opportunities: [],
        recommendations: []
      },
      contentIdeas: analysis.contentIdeas || [],
      metrics,
      categories: analysis.categories || {}
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing partnerships:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze partnerships';
    return NextResponse.json({
      error: errorMessage,
      details: (error as any).response?.data
    }, { status: 500 });
  }
} 