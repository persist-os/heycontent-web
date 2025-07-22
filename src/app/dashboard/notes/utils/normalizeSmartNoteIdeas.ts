import { Idea } from '../components/cards/IdeaCard';

export function normalizeSmartNoteIdeas(rawIdeas: any[]): Idea[] {
  function extractIdea(obj: any): Idea {
    if (typeof obj === 'string') return { content: obj };
    if (obj && typeof obj === 'object') {
      if (obj.event === 'RunResponse' && obj.content) return extractIdea(obj.content);
      if (obj.ideas && Array.isArray(obj.ideas) && obj.ideas.length > 0) return extractIdea(obj.ideas[0]);
      if (obj.content) {
        return {
          content: typeof obj.content === 'string' ? obj.content : JSON.stringify(obj.content),
          summary: obj.summary,
          actionable_steps: Array.isArray(obj.actionable_steps) ? obj.actionable_steps : undefined,
          confidence: typeof obj.confidence === 'number' ? obj.confidence : undefined,
        };
      }
    }
    return { content: obj ? JSON.stringify(obj) : 'No content available' };
  }
  return Array.isArray(rawIdeas)
    ? rawIdeas.map(extractIdea).filter(idea => idea.content && idea.content.trim() !== '')
    : [];
}
