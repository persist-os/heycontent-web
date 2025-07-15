export const welcomeMessageSteps = [
  {
    content: `🎉 **Welcome to HeyContent!**\n\nI'm thrilled you've joined our community of creators and content enthusiasts.`,
    nextLabel: 'Tell me more',
  },
  {
    content: `## What is HeyContent?\nHeyContent is your AI-powered content creation companion that helps you:\n- **Analyze and optimize** your content performance across platforms\n- **Generate fresh ideas** and content strategies tailored to your niche\n- **Create personalized personas** that guide your content direction\n- **Get intelligent insights** about your audience and engagement`,
    nextLabel: 'How does it work?',
  },
  {
    content: `## How Personas Work\nYour persona is like your content DNA - it captures your unique voice, style, goals, and audience. Once created, it helps me:\n- Suggest content that aligns with your brand\n- Maintain consistency across all your platforms\n- Recommend strategic improvements for growth\n- Generate ideas that resonate with your specific audience`,
    nextLabel: 'Show me features',
  },
  {
    content: `## Key Features You Can Use:\n- **Content Analysis**: Connect your social platforms for deep performance insights\n- **Smart Notes**: AI-powered content planning and ideation\n- **Chat Support**: Ask me anything about content strategy, trends, or specific advice\n- **Multi-Platform Integration**: Connect Instagram, YouTube, and more`,
    nextLabel: 'How do I start?',
  },
  {
    content: `## 🚀 Ready to Get Started?\nTo unlock the full power of HeyContent, I recommend creating your personal content persona first. This will help me understand your unique style and goals.\n\n**Simply type: "hey content persona"** to begin the persona creation process!\n\nWhen you're done, type: "hey content write my persona" to generate your persona.\n\nFeel free to ask me anything - I'm here to help you create amazing content! ✨`,
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
  'hey content persona',
  'Tell me about content analysis',
  'How do I connect my social accounts?',
  'What content formats work best?',
];

export const welcomeSuggestionsWithPersona = [
  'hey content persona',
  'Tell me about content analysis',
  'How do I connect my social accounts?',
  'What content formats work best?',
]; 