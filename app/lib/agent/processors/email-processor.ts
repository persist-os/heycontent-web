import { IntentProcessor, ProcessingResult } from '../types';
import { ChatAgentContext } from '../chat-agent';
import { EmailMemoryManagerImpl } from '../../memory/email-memory-manager';
import { EmailSearchTool } from '../tools/email-search';
import { EmailContextManager } from '../email-context-manager';

export class EmailProcessor implements IntentProcessor {
  type = 'email' as const;
  confidence: number = 0.9;
  private emailMemoryManager: EmailMemoryManagerImpl;
  private emailSearchTool: EmailSearchTool;
  private emailContextManager: EmailContextManager;

  constructor(
    userId: string,
    emailMemoryManager: EmailMemoryManagerImpl,
    emailContextManager: EmailContextManager
  ) {
    this.emailMemoryManager = emailMemoryManager;
    this.emailContextManager = emailContextManager;
    this.emailSearchTool = new EmailSearchTool(
      userId,
      emailContextManager,
      emailMemoryManager.getMemorySystem()
    );
  }

  subProcessors = {
    'email_search': async (input: string, context: ChatAgentContext): Promise<ProcessingResult> => {
      try {
        // Extract search terms
        const searchTerms = this.extractSearchTerms(input);
        
        // Check memory first
        const memoryResults = await this.emailMemoryManager.findRelevantEmails(
          input,
          JSON.stringify(context)
        );

        if (memoryResults.confidence > 0.8 && !memoryResults.needsRefresh) {
          return {
            response: this.formatMemoryResponse(memoryResults),
            confidence: memoryResults.confidence,
            metadata: {
              source: 'memory',
              timestamp: Date.now(),
              processingTime: 0
            }
          };
        }

        // Perform live search
        const searchResponse = await this.emailSearchTool._call({
          query: searchTerms.query,
          sender: searchTerms.sender,
          date: searchTerms.date,
          maxResults: 10,
          includeThreads: true,
          skipMemory: false
        });

        if (!searchResponse.success) {
          return {
            response: searchResponse.formattedString,
            confidence: 0.5,
            metadata: {
              source: 'live_search',
              timestamp: Date.now(),
              processingTime: 0
            }
          };
        }

        // Update context and memory
        await this.updateEmailContext(searchResponse.results);
        
        return {
          response: this.formatSearchResponse(searchResponse),
          confidence: 0.9,
          metadata: {
            source: 'live_search',
            timestamp: Date.now(),
            processingTime: 0
          },
          actions: [{
            type: 'update_email_context',
            data: searchResponse.results
          }]
        };

      } catch (error) {
        console.error('Error in email search processor:', error);
        return {
          response: 'Sorry, there was an error searching your emails.',
          confidence: 0,
          metadata: {
            source: 'error',
            timestamp: Date.now(),
            processingTime: 0
          }
        };
      }
    }
  };

  requirements = {
    services: ['gmail'],
    permissions: ['read_email'],
    data: ['email_context']
  };

  private extractSearchTerms(input: string): {
    query: string;
    sender?: string;
    date?: string;
  } {
    // Extract sender
    const senderMatch = input.match(/from:\s*"([^"]+)"|from:\s*(\S+)/i);
    const sender = senderMatch ? (senderMatch[1] || senderMatch[2]) : undefined;

    // Extract date
    const dateMatch = input.match(/date:\s*"([^"]+)"|date:\s*(\S+)/i);
    const date = dateMatch ? (dateMatch[1] || dateMatch[2]) : undefined;

    // Clean query
    const query = input
      .replace(/from:\s*"[^"]+"/g, '')
      .replace(/from:\s*\S+/g, '')
      .replace(/date:\s*"[^"]+"/g, '')
      .replace(/date:\s*\S+/g, '')
      .trim();

    return {
      query,
      sender,
      date
    };
  }

  private formatMemoryResponse(memoryResults: any): string {
    return `Based on my memory, here's what I found:\n\n${
      memoryResults.nodes.map((node: any) => 
        `- ${node.content.subject} (from ${node.content.participants[0]})`
      ).join('\n')
    }`;
  }

  private formatSearchResponse(searchResponse: any): string {
    return `Here's what I found:\n\n${
      searchResponse.results.map((result: any) => 
        `- ${result.subject} (from ${result.from})`
      ).join('\n')
    }`;
  }

  private async updateEmailContext(results: any[]) {
    await this.emailContextManager.updateContext({
      recentEmails: results,
      searchResults: results,
      timestamp: Date.now()
    });
  }
} 