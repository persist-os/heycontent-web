import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import { prisma } from '@/lib/db'
import { google, gmail_v1 } from 'googleapis'
import { Client, AuthProvider } from '@microsoft/microsoft-graph-client'
import { getCompletion } from '@/lib/openai'

interface EmailData {
  id: string
  subject: string
  from: string
  date: string
  body: string
  isRead: boolean
  labels?: string[]
}

type GmailHeader = gmail_v1.Schema$MessagePartHeader
type GmailPart = gmail_v1.Schema$MessagePart
type GmailPayload = gmail_v1.Schema$MessagePart

async function getGmailEmails(accessToken: string): Promise<EmailData[]> {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  const gmail = google.gmail({ version: 'v1', auth })

  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 10
  })

  const emails: EmailData[] = []
  for (const message of response.data.messages || []) {
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!
    })

    const headers = email.data.payload?.headers || []
    const subject = headers.find(h => h.name === 'Subject')?.value || ''
    const from = headers.find(h => h.name === 'From')?.value || ''
    const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString()
    
    let body = ''
    if (email.data.payload?.parts) {
      body = email.data.payload.parts
        .filter(part => part.mimeType === 'text/plain')
        .map(part => Buffer.from(part.body?.data || '', 'base64').toString())
        .join('\n')
    } else if (email.data.payload?.body?.data) {
      body = Buffer.from(email.data.payload.body.data, 'base64').toString()
    }

    emails.push({
      id: message.id!,
      subject,
      from,
      date,
      body,
      isRead: !(email.data.labelIds || []).includes('UNREAD'),
      labels: email.data.labelIds || []
    })
  }

  return emails
}

async function getOutlookEmails(accessToken: string): Promise<EmailData[]> {
  const authProvider: AuthProvider = (done: (error: any, accessToken: string) => void) => {
    done(null, accessToken)
  }

  const client = Client.init({
    authProvider
  })

  const response = await client
    .api('/me/messages')
    .top(10)
    .get()

  return response.value.map((email: any) => ({
    id: email.id,
    subject: email.subject,
    from: email.from.emailAddress.address,
    date: email.receivedDateTime,
    body: email.bodyPreview,
    isRead: email.isRead,
    labels: []
  }))
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's email accounts
    const accounts = await prisma.account.findMany({
      where: {
        userId: session.user.id,
        provider: {
          in: ['gmail', 'outlook']
        }
      }
    })

    const emailPromises = accounts.map(async (account) => {
      try {
        const emails = account.provider === 'gmail'
          ? await getGmailEmails(account.access_token!)
          : await getOutlookEmails(account.access_token!)

        // Analyze each email for partnerships
        const analyzedEmails = await Promise.all(
          emails.map(async (email) => {
            const analysis = await getCompletion([
              { role: 'system', content: 'You are a helpful assistant that analyzes emails to determine if they are related to brand partnerships or collaborations.' },
              { role: 'user', content: `Please analyze this email and determine if it's related to a brand partnership or collaboration. Respond with only "true" or "false".\n\nSubject: ${email.subject}\n\nBody: ${email.body}` }
            ])

            if (analysis) {
              await prisma.partnership.create({
                data: {
                  userId: session.user.id,
                  name: email.subject,
                  status: 'pending',
                  history: {
                    create: {
                      date: new Date(),
                      action: 'Created from email',
                      details: analysis
                    }
                  }
                }
              });
            }

            return {
              ...email,
              isPartnership: analysis?.toLowerCase() === 'true' || false
            }
          })
        )

        return {
          provider: account.provider,
          emails: analyzedEmails
        }
      } catch (error) {
        console.error(`Error fetching ${account.provider} emails:`, error)
        return {
          provider: account.provider,
          error: 'Failed to fetch emails'
        }
      }
    })

    const results = await Promise.all(emailPromises)
    return NextResponse.json(results)

  } catch (error) {
    console.error('[EMAIL_SYNC_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 