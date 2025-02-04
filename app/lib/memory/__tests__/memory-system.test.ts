import { AdvancedMemorySystem } from '../advanced-memory-system';
import { RAGSystem } from '../../rag/rag-system';

// Mock RAGSystem
jest.mock('../../rag/rag-system', () => {
  return {
    RAGSystem: jest.fn().mockImplementation(() => ({
      store: jest.fn().mockResolvedValue(undefined),
      search: jest.fn().mockResolvedValue([{
        id: 'test-id',
        content: {
          subject: 'Test Email',
          body: 'This is a test email content'
        },
        similarity: 0.9
      }])
    }))
  };
});

describe('AdvancedMemorySystem', () => {
  let memorySystem: AdvancedMemorySystem;
  let rag: RAGSystem;

  beforeEach(() => {
    rag = new RAGSystem();
    memorySystem = new AdvancedMemorySystem(rag);
  });

  describe('Email Operations', () => {
    it('should store and retrieve email content', async () => {
      const emailContent = {
        subject: "Test Email",
        body: "This is a test email content",
        from: "test@example.com",
        to: ["recipient@example.com"],
        date: new Date().toISOString()
      };

      // Store the email
      await memorySystem.storeMemory('email', emailContent);
      
      // Retrieve the email
      const results = await memorySystem.retrieveMemory('email', 'test email');
      
      // Log results
      console.log('Retrieved email results:', results);
      
      // Assertions
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const firstResult = results[0];
      expect(firstResult).toHaveProperty('content');
      expect(firstResult.content).toHaveProperty('subject', 'Test Email');
    });
  });
}); 