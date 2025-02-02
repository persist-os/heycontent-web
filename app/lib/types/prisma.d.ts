import { PrismaClient } from '@prisma/client';

declare module '@prisma/client' {
  interface Conversation {
    id: string;
    userId: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    starred: boolean;
    state?: ConversationState | null;
  }

  interface ConversationState {
    id: string;
    conversationId: string;
    currentTopic?: string | null;
    lastTopic?: string | null;
    topicDepth: number;
    contextStack: any;
    pendingActions: any;
    lastResponseType: string;
    emotionalState: any;
    userIntent: any;
    focusMetrics: any;
    conversationFlow: any;
    mentionedEntities?: any;
    queryContext?: any;
    createdAt: Date;
    updatedAt: Date;
  }

  interface ConversationUpdateInput {
    state?: {
      upsert: {
        create: Omit<ConversationState, 'id' | 'conversationId' | 'createdAt' | 'updatedAt'>;
        update: Partial<Omit<ConversationState, 'id' | 'conversationId' | 'createdAt'>>;
      };
    };
  }

  interface ConversationInclude {
    state?: boolean;
  }

  interface PrismaClient {
    conversation: {
      update: (args: {
        where: { id: string };
        data: ConversationUpdateInput;
      }) => Promise<Conversation>;
      findUnique: (args: {
        where: { id: string };
        include?: ConversationInclude;
      }) => Promise<Conversation | null>;
    };
    emailContent: {
      upsert: (args: {
        where: { messageId: string };
        update: any;
        create: any;
      }) => Promise<any>;
      findUnique: (args: {
        where: { messageId: string };
        include?: { analysis?: boolean };
      }) => Promise<any>;
    };
    emailAnalysis: {
      upsert: (args: {
        where: { emailId: string };
        update: any;
        create: any;
      }) => Promise<any>;
      update: (args: {
        where: { emailId: string };
        data: any;
      }) => Promise<any>;
    };
    emailThread: {
      upsert: (args: {
        where: { threadId: string };
        update: any;
        create: any;
      }) => Promise<any>;
      findMany: (args: {
        where: any;
        include?: { analysis?: boolean };
        take?: number;
      }) => Promise<any[]>;
      findUnique: (args: {
        where: { id: string };
        include?: { analysis?: boolean };
      }) => Promise<any>;
    };
    threadAnalysis: {
      findUnique: (args: {
        where: { threadId: string };
      }) => Promise<any>;
      update: (args: {
        where: { threadId: string };
        data: any;
      }) => Promise<any>;
      create: (args: {
        data: any;
      }) => Promise<any>;
    };
    threadRelationship: {
      upsert: (args: {
        where: {
          threadId_relatedThreadId: {
            threadId: string;
            relatedThreadId: string;
          };
        };
        update: any;
        create: any;
      }) => Promise<any>;
    };
    emailSearchCache: {
      findUnique: (args: {
        where: {
          query_userId: {
            query: string;
            userId: string;
          };
        };
      }) => Promise<{
        id: string;
        query: string;
        userId: string;
        results: any;
        createdAt: Date;
        expiresAt: Date;
      } | null>;
      upsert: (args: {
        where: {
          query_userId: {
            query: string;
            userId: string;
          };
        };
        update: any;
        create: any;
      }) => Promise<any>;
    };
    $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Promise<T>;
  }
}

export {}; 