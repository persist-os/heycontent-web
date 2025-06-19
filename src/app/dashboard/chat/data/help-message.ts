import { Message } from '@/app/types/chat';

export const helpMessage: Message = {
  id: 'help-message',
  content: `## 🆘 HeyContent Help Center\n\nHere are some helpful tips to get the most out of HeyContent:\n\n### 🔍 Content Analysis\n- Connect your social platforms to analyze performance\n- Get insights on your top-performing content\n- Identify trends and patterns in your audience engagement\n\n### 🎭 Persona Management\n- Create your content persona with \"hey content persona\"\n- Update your persona anytime with \"hey content update persona\"\n- Let your persona guide content recommendations\n\n### 💡 Content Creation\n- Ask for content ideas based on your niche\n- Get help with writing engaging captions and posts\n- Request content strategy recommendations\n\n### 🔗 Platform Integration\n- Connect multiple social media accounts\n- Schedule and publish content across platforms\n- Track performance metrics in one place\n\n### 💬 Need more help?\nType your question or describe what you're trying to accomplish, and I'll do my best to assist you!`,
  chat_response: `## 🆘 HeyContent Help Center\n\nHere are some helpful tips to get the most out of HeyContent:\n\n### 🔍 Content Analysis\n- Connect your social platforms to analyze performance\n- Get insights on your top-performing content\n- Identify trends and patterns in your audience engagement\n\n### 🎭 Persona Management\n- Create your content persona with \"hey content persona\"\n- Update your persona anytime with \"hey content update persona\"\n- Let your persona guide content recommendations\n\n### 💡 Content Creation\n- Ask for content ideas based on your niche\n- Get help with writing engaging captions and posts\n- Request content strategy recommendations\n\n### 🔗 Platform Integration\n- Connect multiple social media accounts\n- Schedule and publish content across platforms\n- Track performance metrics in one place\n\n### 💬 Need more help?\nType your question or describe what you're trying to accomplish, and I'll do my best to assist you!`,
  role: 'assistant',
  timestamp: new Date().toISOString(),
  suggestions: [
    'hey content persona',
    'How do I analyze my content?',
    'What content should I create next?',
    'How do I connect my social accounts?'
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
