import { RAGSystem } from "../app/lib/rag";
import type { AVADocumentType } from "../app/lib/rag";

async function testEmailConversation() {
  console.log("Initializing test conversation...");
  const rag = new RAGSystem();

  // Add test email documents
  const emails = [
    {
      type: 'email' as AVADocumentType,
      content: `Subject: Partnership Opportunity Discussion
From: partnerships@fentybeauty.com
To: creator@avasetail.com
Date: September 2, 2024

Dear Content Creator,

Thank you for your interest in partnering with Fenty Beauty. We were impressed by your AI and tech-focused content and believe there could be interesting opportunities to collaborate on beauty tech content.

Would love to discuss this further and explore potential collaboration ideas.

Best regards,
Sarah Johnson
Partnerships Manager
Fenty Beauty`,
      metadata: {
        emailMetadata: {
          messageId: 'fenty-sept2-2024',
          threadId: 'fenty-thread-2024',
          subject: 'Partnership Opportunity Discussion',
          from: 'partnerships@fentybeauty.com',
          to: ['creator@avasetail.com'],
          date: '2024-09-02T10:30:00Z',
          isRead: true,
          isStarred: true,
          labels: ['INBOX', 'PARTNERSHIP']
        }
      }
    },
    {
      type: 'email' as AVADocumentType,
      content: `Subject: Re: Partnership Opportunity Discussion
From: creator@avasetail.com
To: partnerships@fentybeauty.com
Date: September 2, 2024

Hi Sarah,

Thank you for reaching out! I'm very excited about the possibility of collaborating with Fenty Beauty.

I'd love to schedule a call to discuss this further.

Best,
Alex`,
      metadata: {
        emailMetadata: {
          messageId: 'fenty-sept2-2024-reply',
          threadId: 'fenty-thread-2024',
          subject: 'Re: Partnership Opportunity Discussion',
          from: 'creator@avasetail.com',
          to: ['partnerships@fentybeauty.com'],
          date: '2024-09-02T11:45:00Z',
          isRead: true,
          isStarred: true,
          labels: ['SENT', 'PARTNERSHIP']
        }
      }
    }
  ];

  // Add emails to RAG system
  console.log("\nAdding test emails to RAG system...");
  for (const email of emails) {
    await rag.addDocument(email.content, {
      user_id: "test-user",
      timestamp: email.metadata.emailMetadata.date,
      type: "email",
      analysis_type: "content",
      emailMetadata: email.metadata.emailMetadata
    });
  }

  // Test conversation flow
  console.log("\nTesting conversation flow...");
  
  // 1. User asks about email partnerships
  console.log("\n1. User: 'Show me my email partnerships'");
  const partnershipEmails = await rag.search('email', "partnership emails");
  console.log("Partnership emails found:", JSON.stringify(partnershipEmails, null, 2));

  // 2. User asks for help with follow-up
  console.log("\n2. User: 'Can you help me write a follow-up?'");
  console.log("AI: To which email would you like to follow up?");

  // 3. User specifies Fenty email
  console.log("\n3. User: 'Follow up to my email with Fenty from Sept 2, 2024'");
  const fentyEmail = await rag.search('email', "email from Fenty Beauty September 2 2024");
  console.log("Found Fenty email:", JSON.stringify(fentyEmail, null, 2));

  // 4. User confirms
  console.log("\n4. User: 'Yes'");
  console.log("AI: Here's a draft follow-up email:");
  console.log(`
Subject: Re: Partnership Opportunity Discussion
To: partnerships@fentybeauty.com

Dear Sarah,

I hope this email finds you well. I wanted to follow up on our previous correspondence regarding the potential partnership between Fenty Beauty and my content creation platform.

I've been thinking about some exciting ways we could collaborate, particularly in creating content that bridges beauty and technology. I'd love to discuss:

1. AI-powered beauty tech reviews and tutorials
2. Data-driven beauty trend analysis
3. Smart beauty device demonstrations

Would you be available for a brief call next week to discuss these ideas further? I'm flexible with timing and can work around your schedule.

Looking forward to your response.

Best regards,
[Your name]`);
}

testEmailConversation().catch(console.error); 