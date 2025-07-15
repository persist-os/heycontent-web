// Utility for unique IDs
export function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9) + Date.now();
}

// Group prompts by agentType (folder name)
export function groupPromptsByAgentType<T extends { agentType?: string; title?: string }>(
  prompts: T[]
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const prompt of prompts) {
    const groupKey = prompt.agentType || prompt.title || 'other';
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(prompt);
  }
  return groups;
} 