import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import { google, gmail_v1 } from 'googleapis'
import { Client, AuthProvider } from '@microsoft/microsoft-graph-client'
import { getCompletion } from '@/app/lib/openai'

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

interface EmailAccount {
  provider: string
  refresh_token: string | null
  access_token: string | null
  scope: string | null
}

async function getGmailEmails(accessToken: string, refreshToken: string | null): Promise<EmailData[]> {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    // Force token refresh
    if (refreshToken) {
      console.log('Refreshing token...');
      const { credentials } = await oauth2Client.refreshAccessToken();
      console.log('Token refreshed successfully');
      oauth2Client.setCredentials(credentials);
    }

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    console.log('Fetching Gmail messages...');
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10
    });
    
    console.log('Found messages:', response.data.messages?.length || 0);
    const emails: EmailData[] = []
    for (const message of response.data.messages || []) {
      try {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!
        });

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
      } catch (error) {
        console.error(`Error fetching Gmail email:`, error)
      }
    }

    return emails
  } catch (error) {
    console.error(`Error fetching Gmail emails:`, error)
    return []
  }
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
    const session = await auth();
    if (!session?.user?.id) {
      console.error('No session or user found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Finding connected accounts...');
    // TODO: Migrate all Prisma-dependent logic to Convex.
    // const accounts = await prisma.account.findMany({
    //   where: {
    //     userId: session.user.id,
    //     provider: 'google',
    //     scope: {
    //       contains: 'gmail.readonly'
    //     }
    //   },
    //   select: {
    //     provider: true,
    //     access_token: true,
    //     refresh_token: true,
    //     scope: true
    //   }
    // });

    // TODO: Migrate all Prisma-dependent logic to Convex.
    // const emailPromises = accounts.map(async (account: EmailAccount) => { ... });
    // const results = await Promise.all(emailPromises)
    // return NextResponse.json(results)
    // END TODO
    return NextResponse.json({ error: 'Account fetching not yet migrated from Prisma to Convex.' }, { status: 501 });

  } catch (error) {
    console.error('[EMAIL_SYNC_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 