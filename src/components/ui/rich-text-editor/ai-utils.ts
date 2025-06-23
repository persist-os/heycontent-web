import { FormatTextParams, insertAtCursor } from './formatting-utils'

export interface AIHandlers {
  onAskAI?: (prompt: string) => Promise<string>
  onRequestAnalysis?: (noteType: string) => Promise<string>
  onRequestIdeas?: () => Promise<string[]>
}

// AI handlers with fallbacks
export const createAIHandlers = (params: FormatTextParams, handlers: AIHandlers) => {
  const handleAskAI = async (prompt: string) => {
    if (handlers.onAskAI) {
      const response = await handlers.onAskAI(prompt)
      insertAtCursor(params, `\n\n${response}`)
    } else {
      insertAtCursor(params, `\n\n**AI Response to: "${prompt}"**\n\n[AI response would appear here]`)
    }
  }

  const handleRequestAnalysis = async (noteType: string) => {
    if (handlers.onRequestAnalysis) {
      const analysis = await handlers.onRequestAnalysis(noteType)
      insertAtCursor(params, `\n\n## Analysis\n\n${analysis}`)
    } else {
      insertAtCursor(params, `\n\n## Analysis (${noteType})\n\n[Analysis would appear here]`)
    }
  }

  const handleRequestIdeas = async () => {
    if (handlers.onRequestIdeas) {
      const ideas = await handlers.onRequestIdeas()
      const ideasText = ideas.map((idea, index) => `${index + 1}. ${idea}`).join('\n')
      insertAtCursor(params, `\n\n## Ideas\n\n${ideasText}`)
    } else {
      insertAtCursor(params, '\n\n## Ideas\n\n1. [Idea 1]\n2. [Idea 2]\n3. [Idea 3]')
    }
  }

  const handleGenerateTableFromContent = async () => {
    const tablePrompt = `Based on the following content, create a relevant and useful markdown table that organizes or summarizes key information. The table should have appropriate headers and meaningful data extracted from the content. If the content doesn't contain tabular data, create a summary table or analysis table that would be helpful for understanding the content.

Content:
${params.content}

Please respond with only the markdown table, no additional text.`

    if (handlers.onAskAI) {
      const response = await handlers.onAskAI(tablePrompt)
      insertAtCursor(params, `\n\n${response}`)
    } else {
      insertAtCursor(params, `\n\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Data 1   | Data 2   | Data 3   |\n| Data 4   | Data 5   | Data 6   |`)
    }
  }

  return {
    handleAskAI,
    handleRequestAnalysis,
    handleRequestIdeas,
    handleGenerateTableFromContent
  }
} 