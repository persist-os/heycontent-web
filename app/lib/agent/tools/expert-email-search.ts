import { z } from 'zod';
import { BaseTool } from './base-tool';
import { ExpertEmailService, EmailQueryOptions, EmailQueryResult } from '../../services/expert-email-service';
import { GmailService } from '../../services/gmail';
import { EmailMemoryManagerImpl } from '../../memory/email-memory-manager';
import { ThreadManagementService } from '../../services/thread-management';
import { formatEmailResponse } from '../../utils/format-utils';

export class ExpertEmailSearchTool extends BaseTool {
  private expertEmailService: ExpertEmailService;

  constructor(
    private gmailService: GmailService,
    private emailMemoryManager: EmailMemoryManagerImpl,
    private threadManagementService: ThreadManagementService
  ) {
    super();
    this.expertEmailService = new ExpertEmailService(
      gmailService,
      emailMemoryManager,
      threadManagementService
    );
  }

  name = 'expert_email_search';
  description = 'Search emails with expert-level analysis and insights';

  protected _schema = z.object({
    query: z.string().describe('The search query to find relevant emails'),
    options: z.object({
      includeThreadHistory: z.boolean().optional().describe('Whether to include email thread history'),
      maxResults: z.number().optional().describe('Maximum number of results to return'),
      analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']).optional()
        .describe('Depth of analysis to perform'),
      timeRange: z.object({
        start: z.date(),
        end: z.date()
      }).optional().describe('Time range for the search')
    }).optional()
  });

  async execute(args: z.infer<typeof this._schema>): Promise<{
    success: boolean;
    result?: EmailQueryResult;
    formattedResponse?: string;
    error?: string;
  }> {
    try {
      // Ensure Gmail service is ready
      const isReady = await this.ensureServiceReady();
      if (!isReady) {
        return {
          success: false,
          error: 'Gmail service is not ready. Please authenticate first.'
        };
      }

      // Process the query with expert analysis
      const result = await this.expertEmailService.processEmailQuery(
        args.query,
        args.options as EmailQueryOptions
      );

      // Format the response for display
      const formattedResponse = this.formatExpertResponse(result);

      return {
        success: true,
        result,
        formattedResponse
      };

    } catch (error) {
      console.error('Expert email search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Expert email search failed'
      };
    }
  }

  protected async _call(args: z.infer<typeof this._schema>): Promise<string> {
    const result = await this.execute(args);
    if (!result.success) {
      throw new Error(result.error || 'Expert email search failed');
    }
    return result.formattedResponse || 'No results found';
  }

  private async ensureServiceReady(): Promise<boolean> {
    try {
      // Check Gmail service state
      const metrics = await this.gmailService.getEmailMetrics();
      return metrics.totalEmails >= 0;
    } catch (error) {
      console.error('Service readiness check failed:', error);
      return false;
    }
  }

  private formatExpertResponse(result: EmailQueryResult): string {
    const { response, relatedEmails, threadContext } = result;
    const parts: string[] = [];

    // Add overview section
    parts.push('📋 OVERVIEW');
    parts.push(`Summary: ${response.overview.summary}`);
    parts.push('\nKey Points:');
    response.overview.keyPoints.forEach(point => {
      parts.push(`• ${point}`);
    });
    parts.push(`\nContext: ${response.overview.context}`);

    // Add recommendations section
    parts.push('\n🎯 RECOMMENDATIONS');
    if (response.recommendations.immediate.length) {
      parts.push('\nImmediate Actions:');
      response.recommendations.immediate.forEach(rec => {
        parts.push(`• ${rec}`);
      });
    }
    if (response.recommendations.strategic.length) {
      parts.push('\nStrategic Considerations:');
      response.recommendations.strategic.forEach(rec => {
        parts.push(`• ${rec}`);
      });
    }

    // Add next steps section
    parts.push('\n📅 NEXT STEPS');
    response.nextSteps.forEach(step => {
      parts.push(`• ${step.action} (${step.priority} priority, ${step.timeline})`);
    });

    // Add related emails section if available
    if (relatedEmails?.length) {
      parts.push('\n📧 RELATED EMAILS');
      relatedEmails.forEach(email => {
        parts.push(
          `\nFrom: ${email.from}`,
          `Subject: ${email.subject}`,
          `Date: ${email.date.toLocaleDateString()}`
        );
      });
    }

    // Add thread context if available
    if (threadContext) {
      parts.push(
        '\n🔄 THREAD CONTEXT',
        `Messages: ${threadContext.messageCount}`,
        `Date Range: ${threadContext.dateRange.start.toLocaleDateString()} - ${threadContext.dateRange.end.toLocaleDateString()}`
      );
    }

    return parts.join('\n');
  }

  private formatAnalysisSection(title: string, content: string[]): string {
    if (!content.length) return '';
    return `\n${title}\n${content.map(item => `• ${item}`).join('\n')}`;
  }
} 