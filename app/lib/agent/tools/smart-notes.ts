import { BaseTool } from "./base-tool";
import { z } from "zod";
import { RAGSystem, AVADocumentType } from "@/lib/rag";

const NotesAnalysisSchema = z.object({
  content: z.string(),
  analysis_type: z.enum([
    "summary", 
    "key_points", 
    "action_items", 
    "sentiment",
    "partnership",
    "content",
    "engagement",
    "market",
    "platform"
  ]),
  max_length: z.number().optional()
});

export class SmartNotesTool extends BaseTool {
  name = "notes_analysis";
  description = "Analyzes content and provides insights. Input should be a JSON string with content and analysis_type.";
  protected _schema = NotesAnalysisSchema;

  constructor(private rag: RAGSystem) {
    super();
  }

  private sanitizeInput(input: string): { content: string, analysis_type: string, max_length?: number } {
    try {
      // Clean the input string first
      const cleanedInput = input.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
                               .replace(/\\n/g, ' ')
                               .replace(/\s+/g, ' ')
                               .trim();

      // Try parsing as JSON first
      let parsed;
      try {
        parsed = JSON.parse(cleanedInput);
      } catch {
        // If direct parsing fails, try to extract content from a potential larger JSON string
        const contentMatch = cleanedInput.match(/"content"\s*:\s*"([^"]+)"/);
        const typeMatch = cleanedInput.match(/"analysis_type"\s*:\s*"([^"]+)"/);
        
        if (contentMatch) {
          parsed = {
            content: contentMatch[1],
            analysis_type: typeMatch ? typeMatch[1] : 'summary'
          };
        } else {
          // If no JSON structure found, treat entire input as content
          parsed = {
            content: cleanedInput,
            analysis_type: 'summary'
          };
        }
      }

      return {
        content: String(parsed.content || '').trim(),
        analysis_type: String(parsed.analysis_type || 'summary'),
        max_length: parsed.max_length ? Number(parsed.max_length) : undefined
      };
    } catch (e) {
      // Fallback for any unexpected errors
      console.error('Error sanitizing input:', e);
      return {
        content: input.slice(0, 1000).trim(), // Limit content length as safety measure
        analysis_type: 'summary'
      };
    }
  }

  async analyzeNotes(content: string, analysisType: string, maxLength: number = 500) {
    try {
      // Get relevant notes from RAG system
      const notes = await this.rag.search(content, { 
        type: analysisType as AVADocumentType 
      }, maxLength);
      
      if (!notes || notes.length === 0) {
        return {
          status: 'no_notes',
          message: 'No relevant notes or insights found. Try adding some notes first!'
        };
      }

      // Sort notes by date, newest first
      const sortedNotes = notes.sort((a, b) => 
        new Date(b.metadata?.timestamp || 0).getTime() - 
        new Date(a.metadata?.timestamp || 0).getTime()
      );

      switch (analysisType) {
        case 'summary':
          return {
            status: 'success',
            summary: this.generateSummary(sortedNotes),
            noteCount: notes.length,
            latestUpdate: sortedNotes[0].metadata?.timestamp
          };

        case 'key_points':
          return {
            status: 'success',
            keyPoints: this.extractKeyPoints(sortedNotes),
            noteCount: notes.length,
            latestUpdate: sortedNotes[0].metadata?.timestamp
          };

        case 'action_items':
          return {
            status: 'success',
            actionItems: this.extractActionItems(sortedNotes),
            noteCount: notes.length,
            latestUpdate: sortedNotes[0].metadata?.timestamp
          };

        case 'sentiment':
          return {
            status: 'success',
            sentiment: this.analyzeSentiment(sortedNotes),
            noteCount: notes.length,
            latestUpdate: sortedNotes[0].metadata?.timestamp
          };

        case 'partnership':
        case 'content':
        case 'engagement':
        case 'market':
        case 'platform':
          return {
            status: 'success',
            insights: this.generateInsights(sortedNotes, analysisType),
            noteCount: notes.length,
            latestUpdate: sortedNotes[0].metadata?.timestamp
          };

        default:
          throw new Error(`Unsupported analysis type: ${analysisType}`);
      }
    } catch (error) {
      console.error('Error analyzing notes:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private generateInsights(notes: any[], type: string) {
    return {
      type,
      insights: notes.map(note => ({
        title: note.metadata?.title || 'Insight',
        description: note.pageContent,
        priority: note.metadata?.priority || 'medium',
        timestamp: note.metadata?.timestamp,
        source: note.metadata?.source || 'analysis',
        data: note.metadata?.data || {}
      }))
    };
  }

  private generateSummary(notes: any[]): string {
    const combinedContent = notes
      .map(note => note.content)
      .join('\n');
    
    // For now, return a simple concatenated summary
    // This could be enhanced with AI summarization later
    return combinedContent.slice(0, 500) + (combinedContent.length > 500 ? '...' : '');
  }

  private extractKeyPoints(notes: any[]): string[] {
    const keyPoints = new Set<string>();
    
    notes.forEach(note => {
      const lines = note.content.split('\n');
      lines.forEach((line: string) => {
        // Look for bullet points, numbers, or important markers
        if (line.match(/^[-•*]|\d+\.|!important|key:/i)) {
          keyPoints.add(line.trim());
        }
      });
    });

    return Array.from(keyPoints);
  }

  private extractActionItems(notes: any[]): string[] {
    const actionItems = new Set<string>();
    
    notes.forEach(note => {
      const lines = note.content.split('\n');
      lines.forEach((line: string) => {
        // Look for todo markers or action-oriented phrases
        if (line.match(/^(todo|task|action|[-*])\s|need to|should|must/i)) {
          actionItems.add(line.trim());
        }
      });
    });

    return Array.from(actionItems);
  }

  private analyzeSentiment(notes: any[]): {
    overall: 'positive' | 'neutral' | 'negative',
    score: number,
    details: string
  } {
    let totalScore = 0;
    const positiveWords = ['success', 'improvement', 'growth', 'achieved', 'excellent'];
    const negativeWords = ['issue', 'problem', 'decline', 'failed', 'poor'];
    
    notes.forEach(note => {
      const content = note.content.toLowerCase();
      positiveWords.forEach(word => {
        if (content.includes(word)) totalScore++;
      });
      negativeWords.forEach(word => {
        if (content.includes(word)) totalScore--;
      });
    });

    const normalizedScore = totalScore / notes.length;
    
    return {
      overall: normalizedScore > 0.3 ? 'positive' : normalizedScore < -0.3 ? 'negative' : 'neutral',
      score: normalizedScore,
      details: `Analysis based on ${notes.length} notes`
    };
  }

  async _call(input: string) {
    try {
      const sanitizedInput = this.sanitizeInput(input);
      const analysis = await this.analyzeNotes(
        sanitizedInput.content,
        sanitizedInput.analysis_type,
        sanitizedInput.max_length
      );
      return JSON.stringify(analysis);
    } catch (error) {
      console.error('Error in content analysis:', error);
      return JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : 'An error occurred during analysis',
        fallback_content: input
      });
    }
  }
} 