export interface TagUsage {
  tag: string;
  count: number;
  lastUsed: number; // timestamp of when tag was last used
}

export interface NoteTagData {
  tags: string[];
  updatedAt: number;
}

/**
 * Calculate the most recently used tags from note data
 */
export function getRecentTags(noteTagData: NoteTagData[], limit: number = 3): string[] {
  const tagLastUsed = new Map<string, number>();

  // Find the most recent usage of each tag
  noteTagData.forEach(note => {
    note.tags?.forEach(tag => {
      if (tag.trim()) {
        const currentLastUsed = tagLastUsed.get(tag) || 0;
        if (note.updatedAt > currentLastUsed) {
          tagLastUsed.set(tag, note.updatedAt);
        }
      }
    });
  });

  // Sort by most recent usage and return top tags
  return Array.from(tagLastUsed.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by timestamp descending (most recent first)
    .slice(0, limit)
    .map(([tag]) => tag);
}

/**
 * Calculate the most popular tags from note data
 */
export function getPopularTags(noteTagData: NoteTagData[], limit: number = 15): Array<{ tag: string; count: number }> {
  const tagCounts = new Map<string, number>();
  
  // Count tag occurrences across all notes
  noteTagData.forEach(note => {
    note.tags?.forEach(tag => {
      if (tag.trim()) { // Only include non-empty tags
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    });
  });
  
  // Convert to array and sort by frequency (descending), then alphabetically
  return Array.from(tagCounts.entries())
    .sort((a, b) => {
      // First sort by count (descending)
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }
      // Then sort alphabetically
      return a[0].toLowerCase().localeCompare(b[0].toLowerCase());
    })
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
} 