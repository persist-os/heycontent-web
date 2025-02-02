import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import prisma from '@/app/lib/prisma'
import { getCompletion } from '@/app/lib/openai'
import type { PrismaClient, Prisma, SocialAccount } from '@prisma/client'

// Keywords that might indicate partnership opportunities
const PARTNERSHIP_KEYWORDS = [
  'collaboration',
  'partnership',
  'sponsor',
  'opportunity',
  'proposal',
  'brand deal',
  'paid promotion',
  'affiliate',
  'ambassador',
  'influencer',
  'campaign',
  'promote',
  'advertise',
  'feature',
  'work together',
  'compensation',
  'agreement',
  'sponsorship',
  'monetization',
  'brand ambassador',
  'content creator',
  'endorsement',
  'commission',
  'revenue share',
  'joint venture',
  'collab',
  'paid partnership',
  'business opportunity',
  'marketing opportunity',
  'promotional',
  'sponsored content',
  'brand collaboration',
  'creator program',
  'partnership program',
  'affiliate program',
  'business proposal'
]

async function analyzeEmailContent(subject: string, body: string) {
  try {
    const prompt = `Analyze this email for potential partnership or collaboration opportunities:
    Subject: ${subject}
    Body: ${body}

    Please analyze this email and provide:
    1. Is this a partnership opportunity? (yes/no)
    2. What type of partnership/opportunity is it?
    3. Estimated value/potential (if applicable)
    4. Key points or requirements
    5. Recommended action
    
    Format the response as JSON.`

    const analysis = await getCompletion([
      {
        role: 'system',
        content: 'You are an AI assistant specialized in analyzing emails for content creators. Focus on identifying partnership opportunities, brand deals, and collaboration requests.'
      },
      {
        role: 'user',
        content: prompt
      }
    ])

    if (!analysis) return null

    try {
      return JSON.parse(analysis)
    } catch (error) {
      console.error('[ANALYSIS_PARSE_ERROR]', error)
      return null
    }
  } catch (error) {
    console.error('[OPENAI_API_ERROR]', error)
    return null
  }
}

function containsPartnershipKeywords(text: string): boolean {
  const lowercaseText = text.toLowerCase()
  return PARTNERSHIP_KEYWORDS.some(keyword => 
    lowercaseText.includes(keyword.toLowerCase())
  )
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { emailId, subject, content, from, date } = body

    // Quick check if email might be partnership-related
    if (!containsPartnershipKeywords(subject + ' ' + content)) {
      return NextResponse.json({
        isPartnership: false,
        confidence: 0.99,
        message: 'Email does not appear to be partnership-related'
      })
    }

    // Perform detailed analysis with AI
    const analysis = await analyzeEmailContent(subject, content)

    if (!analysis) {
      return NextResponse.json({
        error: 'Failed to analyze email'
      }, { status: 500 })
    }

    // Save the analysis if it's a partnership opportunity
    if (analysis.isPartnership) {
      try {
        await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
          const user = await tx.user.findUnique({
            where: { id: session.user.id },
            include: {
              socialAccounts: {
                where: {
                  platform: { in: ['gmail', 'outlook'] }
                }
              }
            }
          })

          if (!user) {
            throw new Error('User not found')
          }

          // Update each relevant social account
          for (const account of user.socialAccounts) {
            await tx.socialAccount.update({
              where: { id: account.id },
              data: {
                metrics: {
                  partnerships: {
                    create: {
                      emailId,
                      subject,
                      from,
                      date,
                      analysis: analysis,
                      status: 'new'
                    }
                  }
                }
              }
            })
          }
        })
      } catch (dbError) {
        console.error('[PRISMA_ERROR]', dbError)
        // Continue execution even if saving fails
      }
    }

    return NextResponse.json(analysis)

  } catch (error) {
    console.error('[EMAIL_ANALYSIS_ERROR]', error)
    return NextResponse.json({ 
      error: 'Internal Server Error' 
    }, { status: 500 })
  } finally {
    // Ensure Prisma connection is properly closed
    await prisma.$disconnect()
  }
} 