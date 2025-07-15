import { Message } from '@/app/types/chat';

export const helpMessage: Message = {
  id: 'help-message',
  content: `## 🆘 HeyContent Help Center

Here are powerful tips to master HeyContent and boost your productivity:

### ⚡ Command Palette (Your Productivity Superpower)
**Press \`⌘K\` (Cmd+K) anywhere to open the Command Palette**
- **Quick Navigation**: Jump to any page instantly - Chat, Content Hub, Smart Notes, Self Hub
- **Create New Notes**: Quickly create notes without leaving your current page
- **Theme Toggle**: Switch between light and dark mode on the fly
- **Quick Ask**: Type your question and hit Enter to instantly start a content conversation
- **Smart Search**: Search across all your conversations, notes, and insights in one place
- **Recent & History**: Your most-used commands appear first for faster access

### 🎯 Navigation Mastery
**Chat With Content** - Your AI content strategist lives here
- This is where the magic happens - ask anything about content strategy, trends, or ideas
- Recent chats are saved in the sidebar for quick access
- Use natural language - no need for formal commands

**Content Hub** - Your analytics powerhouse  
- Connect social platforms to analyze what's actually working
- Get data-driven insights instead of guessing
- Track performance across all your content channels

**Smart Notes** - Your idea capture system
- Turn conversations into actionable notes
- AI helps organize and structure your thoughts
- Perfect for planning content series or campaigns

**Self Hub** - Your content persona lab
- Define and refine your content voice and style
- See your usage patterns and optimize your workflow
- Manage your content identity across platforms

### 🔥 Pro Tips for Power Users
- **Keyboard First**: Use \`⌘K\` → type → Enter for lightning-fast actions
- **Context Switching**: Jump between Chat → Notes → Analytics seamlessly via Command Palette
- **Question Everything**: The AI understands context from your previous conversations
- **Save Ideas Fast**: Mid-conversation, use Command Palette to quickly save insights as notes
- **Pattern Recognition**: Let the Content Hub show you what formats/topics perform best

### 🚀 Advanced Workflows
1. **Content Planning**: Chat for ideas → Save to Notes → Analyze performance in Content Hub
2. **Research Mode**: Use Command Palette to search past conversations for inspiration
3. **Quick Iteration**: Ask follow-up questions in Chat, use \`⌘K\` to find related past discussions

### 💡 Still stuck?
The Command Palette is your best friend - \`⌘K\` and type your question naturally. The AI will understand and help you navigate to exactly what you need!`,
  chat_response: `## 🆘 HeyContent Help Center

Here are powerful tips to master HeyContent and boost your productivity:

### ⚡ Command Palette (Your Productivity Superpower)
**Press \`⌘K\` (Cmd+K) anywhere to open the Command Palette**
- **Quick Navigation**: Jump to any page instantly - Chat, Content Hub, Smart Notes, Self Hub
- **Create New Notes**: Quickly create notes
- **Theme Toggle**: Switch between light and dark mode on the fly
- **Quick Ask**: Type your question and hit Enter to instantly start a content conversation
- **Smart Search**: Search across all your conversations, notes, and insights in one place
- **Recent & History**: Your most-used commands appear first for faster access

### 🎯 Navigation Mastery
**Chat With Content** - Your AI content strategist lives here
- This is where the magic happens - ask anything about content strategy, trends, or ideas
- Recent chats are saved in the sidebar for quick access
- Use natural language - no need for formal commands

**Content Hub** - Your analytics powerhouse  
- Connect social platforms to analyze what's actually working
- Get data-driven insights instead of guessing
- Track performance across all your content channels

**Smart Notes** - Your idea capture system
- Turn conversations into actionable notes
- AI helps organize and structure your thoughts
- Perfect for planning content series or campaigns

**Self Hub** - Your content persona lab
- Define and refine your content voice and style
- See your usage patterns and optimize your workflow
- Manage your content identity across platforms

### 🔥 Pro Tips for Power Users
- **Keyboard First**: Use \`⌘K\` → type → Enter for lightning-fast actions
- **Context Switching**: Jump between Chat → Notes → Analytics seamlessly via Command Palette
- **Question Everything**: The AI understands context from your previous conversations
- **Save Ideas Fast**: Use Command Palette to quickly save insights as notes
- **Pattern Recognition**: Let the Content Hub show you what formats/topics perform best

### 🚀 Advanced Workflows
1. **Content Planning**: Chat for ideas → Save to Notes → Analyze performance in Content Hub
2. **Research Mode**: Use Command Palette to search past conversations for inspiration
3. **Quick Iteration**: Ask follow-up questions in Chat, use \`⌘K\` to find related past discussions

### 💡 Still stuck?
The Command Palette is your best friend - \`⌘K\` and type your question naturally. The AI will understand and help you navigate to exactly what you need!`,
  role: 'assistant',
  timestamp: new Date().toISOString(),
  suggestions: [
    'Explain how to use ⌘K to open Command Palette',
    'How do I create new notes?',
    'Show me Content Hub features',
    'Help me set up my content persona'
  ],
  metadata: { help: true },
  sessionId: undefined
};

export function getHelpMessage(): Message {
  return {
    ...helpMessage,
    id: `help-${Date.now()}`,
    timestamp: new Date().toISOString(),
    sessionId: undefined
  };
}
