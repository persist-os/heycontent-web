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
  date: Date
  content: string
}

async function getGmailEmails(accessToken: string): Promise<EmailData[]> {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })
  
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'newer_than:30d',
    maxResults: 100
  })

  const emails: EmailData[] = []
  for (const message of response.data.messages || []) {
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!,
      format: 'full'
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
      id: message.id || '',
      subject,
      from,
      date: new Date(date),
      content: body
    })
  }

  return emails
}

async function getOutlookEmails(accessToken: string): Promise<EmailData[]> {
  const authProvider: AuthProvider = (done) => {
    done(null, accessToken)
  }

  const client = Client.init({
    authProvider
  })

  const response = await client
    .api('/me/messages')
    .select('id,subject,from,receivedDateTime,body')
    .filter("receivedDateTime ge " + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .top(100)
    .get()

  return response.value.map((email: any) => ({
    id: email.id,
    subject: email.subject,
    from: email.from.emailAddress.address,
    date: new Date(email.receivedDateTime),
    content: email.body.content
  }))
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const emailAccounts = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        socialAccounts: {
          where: {
            platform: { in: ['gmail', 'outlook'] as const },
            isConnected: true
          }
        }
      }
    })

    const results = {
      analyzed: 0,
      partnerships: 0,
      error: null as string | null
    }

    for (const account of emailAccounts?.socialAccounts || []) {
      try {
        const emails = account.platform === 'gmail'
          ? await getGmailEmails(account.accessToken!)
          : await getOutlookEmails(account.accessToken!)

        for (const email of emails) {
          results.analyzed++

          const response = await fetch('/api/email/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(email)
          })

          const analysis = await response.json()
          if (analysis.isPartnership) {
            results.partnerships++
          }
        }
      } catch (error) {
        console.error(`Error processing ${account.platform} emails:`, error)
        results.error = `Error processing ${account.platform} emails: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('[EMAIL_SYNC_ERROR]', error)
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 