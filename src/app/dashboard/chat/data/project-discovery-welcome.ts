export const projectDiscoveryWelcomeSteps = [
  {
    content: `**Welcome to Project Discovery! 🚀**\n\nI'm here to help you discover and understand your project through conversation. Together, we'll explore your project's unique characteristics, goals, and potential.`,
    nextLabel: 'How does this work?',
  },
  {
    content: `## How Project Discovery Works\n\nI'll ask you thoughtful questions about your project, and through our conversation, I'll build a comprehensive "fingerprint" of your project that includes:\n\n- **Core purpose and vision**\n- **Key challenges and opportunities**\n- **Working style and preferences**\n- **Success metrics and goals**\n- **Timeline and milestones**`,
    nextLabel: 'What happens next?',
  },
  {
    content: `## What Happens Next?\n\nAfter we chat for a bit (about 8 messages), I'll:\n\n1. **Generate your project fingerprint** - A detailed analysis of your project's unique characteristics\n2. **Create personalized widgets** - Custom tools and dashboards tailored to your project\n3. **Take you to your project dashboard** - Where you can see everything in action\n\nReady to start exploring your project?`,
    nextLabel: 'Let\'s begin!',
  },
];

export function getProjectDiscoveryWelcomeMessage(step = 0) {
  const { content, nextLabel } = projectDiscoveryWelcomeSteps[step];
  return {
    id: `project-discovery-step-${step}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content,
    chat_response: content,
    role: 'assistant' as const,
    timestamp: new Date().toISOString(),
    suggestions: [nextLabel],
    metadata: { 
      step,
      isProjectDiscovery: true 
    },
  };
}

export const projectDiscoverySuggestions = [
  'Tell me about your project',
  'What are your main goals?',
  'What challenges are you facing?',
  'How do you like to work?',
];
