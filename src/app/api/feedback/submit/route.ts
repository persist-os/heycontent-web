import { NextRequest, NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;

export async function POST(request: NextRequest) {
  try {
    // Get API key and user ID from Authorization header
    const authHeader = request.headers.get('Authorization');
    const { apiKey } = extractAuthInfo(authHeader);
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }

    const formData = await request.formData();
    
    // Extract feedback data
    const type = formData.get('type') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const userEmail = formData.get('userEmail') as string;
    const userName = formData.get('userName') as string;
    const page = formData.get('page') as string;
    const userAgent = formData.get('userAgent') as string;
    const timestamp = formData.get('timestamp') as string;

    // Validate required fields
    if (!type || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Extract screenshots
    const screenshots: File[] = [];
    for (let i = 0; i < 3; i++) {
      const screenshot = formData.get(`screenshot_${i}`) as File;
      if (screenshot) {
        screenshots.push(screenshot);
      }
    }

    // Prepare backend request body
    const backendRequestBody = {
      type,
      title,
      description,
      userEmail,
      userName,
      page,
      userAgent,
      timestamp: parseInt(timestamp),
      screenshots: screenshots.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }))
    };

    // Create a new FormData for the backend with files
    const backendFormData = new FormData();
    backendFormData.append('type', type);
    backendFormData.append('title', title);
    backendFormData.append('description', description);
    backendFormData.append('userEmail', userEmail);
    backendFormData.append('userName', userName);
    backendFormData.append('page', page);
    backendFormData.append('userAgent', userAgent);
    backendFormData.append('timestamp', timestamp);

    // Add screenshots to backend FormData
    screenshots.forEach((file, index) => {
      backendFormData.append(`screenshot_${index}`, file);
    });

    // Proxy the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/v1/feedback/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: backendFormData
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Feedback submission failed' }, { status: response.status });
    }

    // Send to Discord webhook if configured
    if (DISCORD_WEBHOOK_URL) {
      try {
        await sendToDiscord({
          type,
          title,
          description,
          userEmail,
          userName,
          page,
          userAgent,
          timestamp: parseInt(timestamp),
          screenshots: screenshots.length
        });
      } catch (discordError) {
        console.error('Failed to send to Discord:', discordError);
        // Don't fail the request if Discord fails
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ error: 'Internal server error', detail: String(error) }, { status: 500 });
  }
}

async function sendToDiscord(feedback: {
  type: string;
  title: string;
  description: string;
  userEmail: string;
  userName: string;
  page: string;
  userAgent: string;
  timestamp: number;
  screenshots: number;
}) {
  if (!DISCORD_WEBHOOK_URL) return;

  const colorMap = {
    bug: 0xFF0000, // Red
    feature_request: 0x0099FF, // Blue
    general: 0x808080, // Gray
    praise: 0x00FF00 // Green
  };

  const embed = {
    title: `📝 New Feedback: ${feedback.title}`,
    description: feedback.description,
    color: colorMap[feedback.type as keyof typeof colorMap] || 0x808080,
    fields: [
      {
        name: 'Type',
        value: feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1).replace('_', ' '),
        inline: true
      },
      {
        name: 'User',
        value: feedback.userName,
        inline: true
      },
      {
        name: 'Email',
        value: feedback.userEmail,
        inline: true
      },
      {
        name: 'Page',
        value: feedback.page,
        inline: true
      },
      {
        name: 'Screenshots',
        value: feedback.screenshots > 0 ? `${feedback.screenshots} attached` : 'None',
        inline: true
      },
      {
        name: 'Timestamp',
        value: new Date(feedback.timestamp).toLocaleString(),
        inline: true
      }
    ],
    footer: {
      text: 'HeyContext Feedback System'
    },
    timestamp: new Date(feedback.timestamp).toISOString()
  };

  await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      embeds: [embed]
    })
  });
} 