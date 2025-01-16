import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { google } from 'googleapis';
import { validateToken } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { gmail_v1 } from 'googleapis';

interface EmailMetrics {
  total: number;
  replied: number;
  avgResponseTime: number;
}

interface PartnershipMetrics {
  totalEmails: EmailMetrics;
  activeConversations: number;
  potentialPartnerships: number;
  recentActivity: Array<{
    date: string;
    subject: string;
    type: 'incoming' | 'outgoing';
    status: 'replied' | 'pending' | 'no-reply';
  }>;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Get recent partnership-related emails (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // Fix timestamp calculation (convert to seconds) and expand search terms
    const query = `after:${Math.floor(ninetyDaysAgo.getTime() / 1000)} (
      subject:(partnership OR sponsor OR collab OR influencer OR brand OR deal OR 
      collaboration OR sponsorship OR affiliate OR commission OR paid OR promotion OR 
      campaign OR ambassador OR monetization OR revenue OR earnings OR marketing OR 
      business OR proposal OR opportunity OR contract OR payment OR invoice OR giveaway)
      OR
      {partnership sponsor collab influencer brand deal collaboration sponsorship 
      affiliate commission paid promotion campaign ambassador monetization revenue 
      earnings marketing business proposal opportunity contract payment invoice giveaway}
    )`;
    
    console.log('Searching Gmail with query:', query);
    
    // Fetch all messages using pagination
    let allMessages: gmail_v1.Schema$Message[] = [];
    let pageToken: string | undefined | null = undefined;
    
    do {
      const response: gmail_v1.Schema$ListMessagesResponse = (await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 500,
        pageToken: pageToken || undefined
      })).data;
      
      const messages = response.messages || [];
      allMessages = [...allMessages, ...messages];
      pageToken = response.nextPageToken;
      
      console.log('Fetched page of messages:', {
        newMessages: messages.length,
        totalSoFar: allMessages.length,
        hasMorePages: !!pageToken
      });
    } while (pageToken);

    console.log('Total messages found:', allMessages.length);

    // Process messages in batches to avoid rate limits
    const BATCH_SIZE = 50;
    let messageDetails: gmail_v1.Schema$Message[] = [];
    
    for (let i = 0; i < allMessages.length; i += BATCH_SIZE) {
      const batch = allMessages.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(allMessages.length / BATCH_SIZE)}`);
      
      const batchDetails = await Promise.all(
        batch.map(async (msg) => {
          const details = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'metadata',
            metadataHeaders: ['Subject', 'From', 'To', 'Date']
          });
          return details.data;
        })
      );
      
      messageDetails = [...messageDetails, ...batchDetails];
    }

    // Helper function to safely get header value
    const getHeaderValue = (msg: gmail_v1.Schema$Message, headerName: string): string => {
      const headers = msg.payload?.headers;
      if (!headers) return '';
      const header = headers.find(h => h.name === headerName);
      return header?.value || '';
    };

    console.log('Message details:', {
      totalMessages: messageDetails.length,
      subjects: messageDetails.slice(0, 5).map(msg => getHeaderValue(msg, 'Subject')).filter(Boolean)
    });

    // Analyze email patterns
    const metrics: PartnershipMetrics = {
      totalEmails: {
        total: messageDetails.length,
        replied: messageDetails.filter(msg => 
          msg.labelIds?.includes('SENT') || 
          msg.labelIds?.includes('INBOX')
        ).length,
        avgResponseTime: 0
      },
      activeConversations: new Set(
        messageDetails.map(msg => getHeaderValue(msg, 'Subject')).filter(Boolean)
      ).size,
      potentialPartnerships: messageDetails.filter(msg => 
        !msg.labelIds?.includes('SPAM') && 
        !msg.labelIds?.includes('TRASH')
      ).length,
      recentActivity: messageDetails.map(msg => ({
        date: getHeaderValue(msg, 'Date'),
        subject: getHeaderValue(msg, 'Subject'),
        type: msg.labelIds?.includes('SENT') ? 'outgoing' : 'incoming',
        status: msg.labelIds?.includes('UNREAD') ? 'pending' : 'replied'
      }))
    };

    console.log('Final metrics:', metrics);
    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Error fetching partnership metrics:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch partnership metrics',
      details: error.response?.data
    }, { status: 500 });
  }
} 