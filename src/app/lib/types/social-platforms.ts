export interface EmailMessage {
    id: string;
    threadId: string;
    userId: string;  // Adding userId for database relations
    subject: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    body: string;
    snippet?: string;  // Adding optional snippet
    date: Date;
    labels?: string[];
    isRead: boolean;
    isStarred?: boolean;
    attachments?: any[];
    hasAttachments?: boolean;  // Adding explicit hasAttachments property
} 