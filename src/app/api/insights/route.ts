import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getUserIdFromToken } from '@/app/lib/getUserIdFromToken';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];

    // Verify the token
    const decodedToken = await getAuth().verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Mock insights data for now
    const mockInsights = [
      {
        title: "Optimize Video Content Strategy",
        type: "content",
        description: "Based on your recent video performance, there's an opportunity to optimize your content strategy.",
        confidence: 0.85,
        action: {
          steps: [
            "Analyze top-performing video topics",
            "Create content calendar based on audience engagement patterns",
            "Implement A/B testing for video thumbnails"
          ],
          timeToImplement: "1-2 weeks",
          requirements: ["Video analytics access", "Content calendar tool"],
          type: "content_optimization",
          priority: "high"
        },
        data: {
          videos: [
            {
              title: "How to Grow Your Channel",
              views: "10K",
              engagement: "15%"
            },
            {
              title: "Content Creation Tips",
              views: "8K",
              engagement: "12%"
            }
          ],
          sourceDetails: [
            "Average view duration: 8 minutes",
            "Peak engagement time: 6-8 PM EST",
            "Top performing topics: Tutorials, Tips & Tricks"
          ],
          data: [
            "View retention drops after 5 minutes",
            "High engagement on tutorial content",
            "Strong performance on weekend uploads"
          ],
          engagementPotential: "High engagement potential with optimized content"
        }
      },
      {
        title: "Expand to Short-Form Content",
        type: "platform",
        description: "Your audience shows high engagement with short-form content on other platforms.",
        confidence: 0.75,
        action: {
          steps: [
            "Create platform-specific short-form content",
            "Cross-promote between platforms",
            "Track engagement metrics across platforms"
          ],
          timeToImplement: "2-3 weeks",
          requirements: ["Social media accounts", "Content creation tools"],
          type: "platform_expansion",
          priority: "medium"
        },
        data: {
          sourceDetails: [
            "High engagement on Instagram Reels",
            "Growing TikTok presence",
            "Cross-platform audience overlap"
          ],
          data: [
            "30% audience overlap between platforms",
            "Higher engagement on short-form content",
            "Growing trend in vertical video consumption"
          ],
          engagementPotential: "Medium engagement potential with platform expansion"
        }
      },
      {
        title: "Potential Partnership with TechReview",
        type: "partnership",
        description: "TechReview has shown interest in collaborating on content creation.",
        confidence: 0.9,
        action: {
          steps: [
            "Schedule partnership discussion",
            "Define collaboration framework",
            "Create joint content strategy"
          ],
          timeToImplement: "3-4 weeks",
          requirements: ["Partnership agreement", "Content collaboration tools"],
          type: "content_partnership",
          priority: "high"
        },
        data: {
          emails: [
            {
              subject: "Partnership Opportunity",
              from: "partnerships@techreview.com",
              date: "2024-03-15",
              dealValue: 5000,
              dealType: "content_collaboration"
            },
            {
              subject: "Follow-up: Partnership Discussion",
              from: "partnerships@techreview.com",
              date: "2024-03-18",
              dealValue: 5000,
              dealType: "content_collaboration"
            }
          ],
          sourceDetails: [
            "Consistent communication over past week",
            "Clear value proposition from both parties",
            "Alignment in target audience"
          ],
          data: [
            "Shared audience demographics",
            "Complementary content styles",
            "Strong brand alignment"
          ]
        }
      }
    ];

    return NextResponse.json({ insights: mockInsights });
  } catch (error) {
    console.error('Error in insights API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 