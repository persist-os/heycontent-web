import { Message } from '@/app/types/chat';

export const helpMessage: Message = {
  id: 'help-message',
  content: `## How to use your private thinking space

This is your calm space to work through anything. Here's how it works:

### ⚡ Quick Access (⌘K)
**Press \`⌘K\` (Cmd+K) anywhere to quickly navigate**
- **Jump anywhere**: Go to any section instantly - Chat, Notes, or your personal space
- **Create notes**: Capture thoughts without leaving your conversation
- **Switch themes**: Change between light and dark mode
- **Quick questions**: Type anything and start thinking through it immediately
- **Search everything**: Find any past conversation or thought you've had
- **Recent conversations**: Your most important discussions are always at the top

### 🎯 Your different spaces
**Chat** - Your main thinking space
- Bring anything here - work decisions, relationships, life stuff, random thoughts
- Everything is remembered so you can pick up where you left off
- Just talk naturally - no special commands needed

**Notes** - Your idea parking lot
- Turn conversations into notes you can return to
- Keep track of important insights and decisions
- Perfect for things you want to remember long-term

**Personal Space** - How I remember you
- This is where you can update how I understand you
- See patterns in what you think about
- Keep your thinking private and personal

### 🔥 How to get the most from this space
- **Just start talking**: No preparation needed - bring whatever's on your mind
- **Come back anytime**: I remember everything, so conversations continue naturally
- **Ask for what you need**: I can help you think, decide, remember, or just listen
- **Save important stuff**: Use \`⌘K\` to quickly save insights as notes
- **Trust the process**: Sometimes thinking takes time - that's okay

### 🚀 Ways to use this space
1. **Working through decisions**: Talk through options → Save key insights → Come back when ready to decide
2. **Processing experiences**: Share what happened → Explore your feelings → Find patterns over time
3. **Planning and dreaming**: Brainstorm possibilities → Capture what resonates → Build on ideas over time

### 💡 Remember
This space doesn't judge. Bring messy thoughts, half-formed ideas, difficult feelings - whatever you need to work through. I'm here to help you think, not to fix or optimize you.`,
  chat_response: `## How to use your private thinking space

This is your calm space to work through anything. Here's how it works:

### ⚡ Quick Access (⌘K)
**Press \`⌘K\` (Cmd+K) anywhere to quickly navigate**
- **Jump anywhere**: Go to any section instantly - Chat, Notes, or your personal space
- **Create notes**: Capture thoughts without leaving your conversation
- **Switch themes**: Change between light and dark mode
- **Quick questions**: Type anything and start thinking through it immediately
- **Search everything**: Find any past conversation or thought you've had
- **Recent conversations**: Your most important discussions are always at the top

### 🎯 Your different spaces
**Chat** - Your main thinking space
- Bring anything here - work decisions, relationships, life stuff, random thoughts
- Everything is remembered so you can pick up where you left off
- Just talk naturally - no special commands needed

**Notes** - Your idea parking lot
- Turn conversations into notes you can return to
- Keep track of important insights and decisions
- Perfect for things you want to remember long-term

**Personal Space** - How I remember you
- This is where you can update how I understand you
- See patterns in what you think about
- Keep your thinking private and personal

### 🔥 How to get the most from this space
- **Just start talking**: No preparation needed - bring whatever's on your mind
- **Come back anytime**: I remember everything, so conversations continue naturally
- **Ask for what you need**: I can help you think, decide, remember, or just listen
- **Save important stuff**: Use \`⌘K\` to quickly save insights as notes
- **Trust the process**: Sometimes thinking takes time - that's okay

### 🚀 Ways to use this space
1. **Working through decisions**: Talk through options → Save key insights → Come back when ready to decide
2. **Processing experiences**: Share what happened → Explore your feelings → Find patterns over time
3. **Planning and dreaming**: Brainstorm possibilities → Capture what resonates → Build on ideas over time

### 💡 Remember
This space doesn't judge. Bring messy thoughts, half-formed ideas, difficult feelings - whatever you need to work through. I'm here to help you think, not to fix or optimize you.`,
  role: 'assistant',
  timestamp: new Date().toISOString(),
  suggestions: [
    'How do I use ⌘K to navigate quickly?',
    'How do I save thoughts as notes?',
    'What can I talk about here?',
    'How do I update my persona?'
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
