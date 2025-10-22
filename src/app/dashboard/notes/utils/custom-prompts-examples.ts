/**
 * Example custom command prompts for InlineCommandPalette
 * 
 * These are user-specific prompts that appear in the command palette
 * alongside the default hardcoded prompts. They're stored in the 
 * ambientInsights table in Convex.
 * 
 * Custom prompts are designed to be:
 * - STATEMENTS, not questions (since the inline writing agent writes AS the user)
 * - Optimized for the inline writing agent instructions
 * - Personalized to user's specific projects and writing needs
 * - Short enough to leave room for users to add more context before sending
 */

export interface CustomCommandPrompt {
  id: string;
  label: string;
  category: string;
  noteType?: string; // Optional - targets specific note types
}

/**
 * Example custom prompts for a user writing a book
 */
export const BOOK_WRITING_PROMPTS: CustomCommandPrompt[] = [
  {
    id: 'book-outline',
    label: 'Outline the structure for chapter',
    category: 'Book Writing',
    noteType: 'content_script'
  },
  {
    id: 'character-development',
    label: 'Develop character background for',
    category: 'Book Writing',
    noteType: 'content_script'
  },
  {
    id: 'scene-description',
    label: 'Describe the scene where',
    category: 'Book Writing',
    noteType: 'content_script'
  },
  {
    id: 'dialogue-expansion',
    label: 'Expand this into natural dialogue between',
    category: 'Book Writing',
    noteType: 'content_script'
  },
  {
    id: 'plot-progression',
    label: 'Continue the plot by showing how',
    category: 'Book Writing',
    noteType: 'content_script'
  }
];

/**
 * Example custom prompts for a startup founder
 */
export const STARTUP_PROMPTS: CustomCommandPrompt[] = [
  {
    id: 'pitch-deck',
    label: 'Create pitch deck slide about',
    category: 'Startup',
    noteType: 'content_script'
  },
  {
    id: 'investor-update',
    label: 'Draft investor update covering',
    category: 'Startup',
    noteType: 'email_draft'
  },
  {
    id: 'product-roadmap',
    label: 'Plan product roadmap for',
    category: 'Startup',
    noteType: 'project'
  },
  {
    id: 'competitive-analysis',
    label: 'Analyze competitive landscape for',
    category: 'Startup',
    noteType: 'analytics_insight'
  },
  {
    id: 'user-persona',
    label: 'Define user persona for',
    category: 'Startup',
    noteType: 'analytics_insight'
  }
];

/**
 * Example custom prompts for a researcher
 */
export const RESEARCH_PROMPTS: CustomCommandPrompt[] = [
  {
    id: 'literature-review',
    label: 'Summarize key findings from research on',
    category: 'Research',
    noteType: 'analytics_insight'
  },
  {
    id: 'methodology',
    label: 'Design research methodology for studying',
    category: 'Research',
    noteType: 'project'
  },
  {
    id: 'hypothesis',
    label: 'Formulate hypothesis about',
    category: 'Research',
    noteType: 'idea_bank'
  },
  {
    id: 'data-analysis',
    label: 'Analyze data patterns showing',
    category: 'Research',
    noteType: 'analytics_insight'
  },
  {
    id: 'research-questions',
    label: 'Generate research questions about',
    category: 'Research',
    noteType: 'idea_bank'
  }
];

/**
 * Example custom prompts for a content creator
 */
export const CONTENT_CREATOR_PROMPTS: CustomCommandPrompt[] = [
  {
    id: 'video-script',
    label: 'Write video script introducing',
    category: 'Content',
    noteType: 'content_script'
  },
  {
    id: 'social-caption',
    label: 'Create engaging social media caption about',
    category: 'Content',
    noteType: 'content_script'
  },
  {
    id: 'content-ideas',
    label: 'Brainstorm content ideas around',
    category: 'Content',
    noteType: 'idea_bank'
  },
  {
    id: 'blog-outline',
    label: 'Outline blog post structure for',
    category: 'Content',
    noteType: 'content_script'
  },
  {
    id: 'audience-analysis',
    label: 'Analyze audience interest in',
    category: 'Content',
    noteType: 'analytics_insight'
  }
];

/**
 * Helper function to add custom prompts for a user
 * This can be called from the browser console or integrated into a settings UI
 */
export async function addCustomPromptsForUser(
  userId: string,
  prompts: CustomCommandPrompt[]
): Promise<void> {
  try {
    const response = await fetch(`/api/users/${userId}/custom-command-prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customCommandPrompts: prompts,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add custom prompts');
    }

    console.log('✅ Custom prompts added successfully!');
  } catch (error) {
    console.error('❌ Failed to add custom prompts:', error);
    throw error;
  }
}

/**
 * Usage examples (call from browser console):
 * 
 * // Add book writing prompts
 * await addCustomPromptsForUser('your-user-id', BOOK_WRITING_PROMPTS);
 * 
 * // Add startup prompts
 * await addCustomPromptsForUser('your-user-id', STARTUP_PROMPTS);
 * 
 * // Add research prompts
 * await addCustomPromptsForUser('your-user-id', RESEARCH_PROMPTS);
 * 
 * // Add content creator prompts
 * await addCustomPromptsForUser('your-user-id', CONTENT_CREATOR_PROMPTS);
 * 
 * // Mix and match - combine multiple sets
 * await addCustomPromptsForUser('your-user-id', [
 *   ...BOOK_WRITING_PROMPTS,
 *   ...CONTENT_CREATOR_PROMPTS
 * ]);
 */

