import 'openai/shims/node';  // Add OpenAI Node.js shim
import { ChatAgent } from '../chat-agent';
import { RAGSystem } from '../../rag/rag-system';
import { PrismaClient } from '@prisma/client';
import { AdvancedMemorySystem } from '../../memory/advanced-memory-system';
import { MemoryAwareChatSystem } from '../../memory/memory-aware-chat-system';
import { EmailMemoryManagerImpl } from '../../memory/email-memory-manager';
import { EmailContextManager } from '../../context/email-context-manager';
import { ChatOpenAI } from '@langchain/openai';
import { EmailSearchTool } from '../tools/email-search';

// Mock dependencies
jest.mock('../../rag/rag-system');
jest.mock('@prisma/client');
jest.mock('../../memory/advanced-memory-system');
jest.mock('../../memory/memory-aware-chat-system');
jest.mock('../../memory/email-memory-manager');
jest.mock('../../context/email-context-manager');
jest.mock('@langchain/openai');

// Mock EmailSearchTool
jest.mock('../../tools/email-search-tool', () => ({
  EmailSearchTool: jest.fn().mockImplementation(() => ({
    execute: jest.fn()
  }))
}));

describe('ChatAgent', () => {
  let chatAgent: ChatAgent;
  let mockRag: jest.Mocked<RAGSystem>;
  let mockPrisma: jest.Mocked<PrismaClient>;
  const userId = 'test-user-id';
  const platformStatus = [
    {
      platform: 'youtube' as const,
      isConnected: true,
      lastSync: new Date(),
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Initialize mocked dependencies
    mockRag = new RAGSystem() as jest.Mocked<RAGSystem>;
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

    // Create chat agent instance
    chatAgent = new ChatAgent(userId, mockRag, platformStatus);
  });

  describe('Message Intent Detection', () => {
    it('should detect direct inquiry intent', async () => {
      const message = 'What is my latest video performance?';
      const result = await chatAgent.process(message);
      
      expect(result).toBeDefined();
      expect(result.conversationState?.userIntent.type).toBe('direct_inquiry');
      expect(result.conversationState?.userIntent.confidence).toBeGreaterThan(0.5);
    });

    it('should detect email search intent', async () => {
      const message = 'Find emails from John about partnerships from last week';
      const result = await chatAgent.process(message);
      
      expect(result).toBeDefined();
      expect(result.conversationState?.userIntent.type).toBe('email_search');
      expect(result.conversationState?.userIntent.confidence).toBeGreaterThan(0.5);
    });

    it('should detect greeting intent', async () => {
      const message = 'Hi there!';
      const result = await chatAgent.process(message);
      
      expect(result).toBeDefined();
      expect(result.conversationState?.userIntent.type).toBe('greeting');
      expect(result.conversationState?.userIntent.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Emotional State Detection', () => {
    it('should detect excited emotional state', async () => {
      const message = "I'm so thrilled about my latest video performance!";
      const result = await chatAgent.process(message);
      
      expect(result).toBeDefined();
      expect(result.conversationState?.emotionalState.primary).toBe('excited');
      expect(result.conversationState?.emotionalState.intensity).toBeGreaterThan(0.5);
    });

    it('should detect frustrated emotional state', async () => {
      const message = "I'm really struggling with my content strategy lately.";
      const result = await chatAgent.process(message);
      
      expect(result).toBeDefined();
      expect(result.conversationState?.emotionalState.primary).toBe('frustrated');
      expect(result.conversationState?.emotionalState.intensity).toBeGreaterThan(0.5);
    });
  });

  describe('Context Management', () => {
    it('should maintain conversation context across messages', async () => {
      // First message
      await chatAgent.process('How did my latest video perform?');
      
      // Follow-up message
      const result = await chatAgent.process('What about the one before that?');
      
      expect(result).toBeDefined();
      expect(result.conversationState?.currentTopic).toContain('video');
      expect(result.conversationState?.contextStack.length).toBeGreaterThan(0);
    });

    it('should detect topic shifts', async () => {
      // First topic
      await chatAgent.process('How are my YouTube metrics?');
      
      // New topic
      const result = await chatAgent.process('Can you check my partnership emails?');
      
      expect(result).toBeDefined();
      expect(result.conversationState?.focusMetrics.topicChanges).toBeGreaterThan(0);
      expect(result.conversationState?.lastTopic).toContain('youtube');
      expect(result.conversationState?.currentTopic).toContain('email');
    });
  });

  describe('Email Handling', () => {
    it('should process email search requests', async () => {
      const message = 'Find emails about partnerships from last week';
      const result = await chatAgent.process(message);
      
      expect(result).toBeDefined();
      expect(result.output?.content).toBeDefined();
      // Verify memory system was used for email search
      expect(AdvancedMemorySystem.prototype.retrieveMemory)
        .toHaveBeenCalledWith('email', expect.any(String));
    });

    it('should handle email context expiration', async () => {
      // Mock email context expiration
      jest.advanceTimersByTime(31 * 60 * 1000); // Advance past 30-minute TTL
      
      const message = 'What was in that last email?';
      const result = await chatAgent.process(message);
      
      expect(result).toBeDefined();
      expect(result.output?.content).toContain('search');
    });
  });

  describe('Memory System Integration', () => {
    it('should store conversation memory', async () => {
      const message = 'Remember that I prefer short-form video content';
      await chatAgent.process(message);
      
      expect(AdvancedMemorySystem.prototype.storeMemory)
        .toHaveBeenCalledWith(expect.any(String), expect.any(Object));
    });

    it('should retrieve relevant memories', async () => {
      // Mock memory retrieval
      (AdvancedMemorySystem.prototype.retrieveMemory as jest.Mock)
        .mockResolvedValue([{ content: 'User prefers short-form content', similarity: 0.9 }]);
      
      const message = 'What kind of content do I prefer?';
      const result = await chatAgent.process(message);
      
      expect(result.output?.content).toContain('short-form');
    });
  });

  describe('Error Handling', () => {
    it('should handle service unavailability gracefully', async () => {
      // Mock service error
      (AdvancedMemorySystem.prototype.retrieveMemory as jest.Mock)
        .mockRejectedValue(new Error('Service unavailable'));
      
      const message = 'Find my emails';
      const result = await chatAgent.process(message);
      
      expect(result).toBeDefined();
      expect(result.output?.content).toContain('unable');
      expect(result.suggestions).toBeDefined();
    });

    it('should handle invalid input gracefully', async () => {
      const message = ''; // Empty message
      const result = await chatAgent.process(message);
      
      expect(result).toBeDefined();
      expect(result.output?.content).toContain('understand');
    });
  });

  describe('Response Enhancement', () => {
    it('should enhance responses with context', async () => {
      // Mock context retrieval
      (RAGSystem.prototype.search as jest.Mock)
        .mockResolvedValue([{ content: 'Recent video performance improved by 25%', similarity: 0.9 }]);
      
      const message = 'How am I doing?';
      const result = await chatAgent.process(message);
      
      expect(result).toBeDefined();
      expect(result.output?.content).toContain('25%');
      expect(result.output?.insights).toBeDefined();
    });

    it('should generate contextual suggestions', async () => {
      const message = 'My video views are down';
      const result = await chatAgent.process(message);
      
      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.length).toBeGreaterThan(0);
    });
  });

  describe('Smart Processing Pipeline', () => {
    it('should integrate with SmartChatAgent for complex queries', async () => {
      const message = 'Analyze my content strategy and suggest improvements';
      const result = await chatAgent.process(message);
      
      expect(result).toBeDefined();
      expect(result.output?.insights).toBeDefined();
      expect(result.suggestions).toHaveLength(1);
    });

    it('should process messages through the complete pipeline', async () => {
      const message = 'How has my audience engagement changed over time?';
      const result = await chatAgent.process(message);
      
      expect(result.conversationState?.focusMetrics.contextDepth).toBeGreaterThan(0);
      expect(result.conversationState?.contextStack).toHaveLength(1);
    });
  });

  describe('Advanced Memory System', () => {
    it('should handle memory expiration', async () => {
      // Store a memory
      const message = 'Remember that I prefer short videos under 5 minutes';
      await chatAgent.process(message);
      
      // Advance time past expiration
      jest.advanceTimersByTime(31 * 24 * 60 * 60 * 1000); // 31 days
      
      // Try to retrieve expired memory
      const result = await chatAgent.process('What video length do I prefer?');
      expect(result.output?.content).not.toContain('5 minutes');
    });

    it('should prioritize recent and relevant memories', async () => {
      // Store multiple memories
      await chatAgent.process('My best performing video was about AI');
      await chatAgent.process('My latest video was about cooking');
      
      const result = await chatAgent.process('What was my recent video about?');
      expect(result.output?.content).toContain('cooking');
    });
  });

  describe('Context Management', () => {
    it('should calculate context quality accurately', async () => {
      // Generate some context history
      await chatAgent.process('Tell me about my channel');
      await chatAgent.process('What about my subscribers?');
      await chatAgent.process('And my watch time?');
      
      const result = await chatAgent.process('How is my channel doing overall?');
      expect(result.conversationState?.focusMetrics.contextDepth).toBeGreaterThan(1);
      expect(result.conversationState?.focusMetrics.topicChanges).toBe(0);
    });

    it('should handle topic transitions smoothly', async () => {
      await chatAgent.process('How are my video views?');
      const result = await chatAgent.process('What about my email engagement?');
      
      expect(result.conversationState?.focusMetrics.topicChanges).toBe(1);
      expect(result.conversationState?.lastTopic).toBe('video_performance');
      expect(result.conversationState?.currentTopic).toBe('email_engagement');
    });
  });

  describe('Response Enhancement', () => {
    it('should enhance responses with contextual information', async () => {
      // Mock memory system to return relevant context
      (AdvancedMemorySystem.prototype.retrieveMemory as jest.Mock)
        .mockResolvedValue([{
          content: 'Channel growth increased by 25% last month',
          similarity: 0.9
        }]);
      
      const result = await chatAgent.process('How is my channel doing?');
      expect(result.output?.content).toContain('25%');
      expect(result.output?.insights).toBeDefined();
    });

    it('should generate relevant suggestions', async () => {
      const result = await chatAgent.process('My views are down this month');
      
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.length).toBeGreaterThan(0);
      expect(result.suggestions?.[0]).toHaveProperty('action');
      expect(result.suggestions?.[0]).toHaveProperty('reason');
    });
  });

  describe('Tool Integration', () => {
    it('should select appropriate tools based on intent', async () => {
      const result = await chatAgent.process('Find emails about partnerships');
      
      expect(result.conversationState?.userIntent.type).toBe('email_search');
      expect(result.output?.content).toContain('email');
    });

    it('should integrate tool results into response', async () => {
      // Mock email search tool to return results
      const mockEmailResults = [{
        subject: 'Partnership Opportunity',
        sender: 'partner@example.com',
        date: new Date()
      }];
      
      (EmailSearchTool.prototype.execute as jest.Mock)
        .mockResolvedValue(mockEmailResults);
      
      const result = await chatAgent.process('Show me recent partnership emails');
      expect(result.output?.content).toContain('Partnership Opportunity');
    });
  });
}); 