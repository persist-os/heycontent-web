export const welcomeMessageSteps = [
  {
    content: `**Welcome to your private space.**\n\nThis is yours. No one sees it but you. I remember everything so you don't have to.`,
    nextLabel: 'Tell me more',
  },
  {
    content: `## Your space that remembers\nThis is where you can work through anything on your mind:\n- **Sort through your thoughts** - bring any topic, however it shows up\n- **Come back to anything** - I remember all our conversations\n- **Figure things out together** - no judgment, just space to think\n- **Help you move forward** - from wherever you are right now`,
    nextLabel: 'How does it work?',
  },
  {
    content: `## How I remember you\nI learn who you are through our conversations - your way of thinking, what matters to you, how you approach things. This helps me:\n- Understand your unique perspective and voice\n- Remember what we've talked about before\n- Help you think through decisions in your own style\n- Pick up right where we left off, anytime`,
    nextLabel: 'Show me more',
  },
  {
    content: `## What you can do here:\n- **Work through decisions**: Career moves, relationships, life changes\n- **Sort out ideas**: Projects, goals, things you're curious about\n- **Remember important stuff**: I keep track so you can focus on thinking\n- **Come back anytime**: Every conversation is here when you need it`,
    nextLabel: 'How do I start?',
  },
  {
    content: `## Ready to start?\nNo pressure. Just bring whatever's on your mind.\n\nYou can start by telling me about yourself, or jump right into something you're thinking about.\n\nI'm here whenever you need to work through something. This space doesn't forget, so you can always come back. ✨`,
    nextLabel: 'Got it!',
  },
];

export function getWelcomeStepMessage(step = 0) {
  const { content, nextLabel } = welcomeMessageSteps[step];
  return {
    id: `welcome-step-${step}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content,
    chat_response: content,
    role: 'assistant' as const,
    timestamp: new Date().toISOString(),
    suggestions: [nextLabel],
    metadata: { step },
  };
}

export const welcomeSuggestions = [
  'Tell me about yourself',
  'What should I focus on next?',
  'Help me think through a decision',
  'What am I forgetting about this situation?',
];

export const welcomeSuggestionsWithPersona = [
  'Tell me about yourself',
  'What should I focus on next?',
  'Help me think through a decision',  
  'What am I forgetting about this situation?',
]; 