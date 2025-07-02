import { HelpPage } from '@/components/ui/help-modal';

export const chatHelp: HelpPage[] = [
  {
    title: "Welcome to Chat",
    description: "Chat is your AI-powered conversation interface where you can discuss content, get insights, and explore ideas with intelligent assistance. Your persona (if created) is automatically included in every conversation to provide personalized and tailored responses."
  },
  {
    title: "Creating Your Persona",
    description: "Get started by creating your AI persona for personalized responses:\n\n• Type \"hey content persona\" to start the guided setup\n• Answer questions about your content style, focus areas, and goals\n• Once satisfied type \"hey content write my persona\" and your persona will be saved and used in all future conversations\n• Update anytime with \"hey content update persona\"\n\nYour persona helps the AI understand your unique voice and provide more relevant, tailored assistance."
  },
  {
    title: "Content Context System",
    description: "Chat automatically draws context from your connected platforms and content:\n\n• **Platform Content**: Discuss specific Instagram posts, YouTube videos, or Gmail threads by clicking \"Discuss\" from content cards\n• **Smart Context**: The AI automatically accesses relevant information from your connected accounts\n• **Context Box**: When discussing specific content, see details and toggle analysis inclusion\n• **Context Search**: Enable to search your content library for relevant information\n\nContent context appears as a blue box above messages when active."
  },
  {
    title: "Getting Started",
    description: "Start conversations in multiple ways:\n\n• Type any question or topic in the input area\n• Use quick action buttons for common tasks (\"Analyze my latest posts\", \"Content ideas\", etc.)\n• Click \"Discuss\" on any content piece from Content Hub or Analytics\n• Ask for analysis of your connected platform content\n• Upload or reference specific content pieces\n\nThe AI understands your content ecosystem and can provide insights across all connected platforms."
  },
  {
    title: "Message Features & Interactions",
    description: "Interact with chat messages:\n\n• **Reference Messages**: Click the reference icon to ask follow-up questions about specific messages\n• **Copy Content**: Copy message text for use elsewhere\n• **Quote to Notepad**: Save important insights to your integrated notepad\n• **Follow-up Suggestions**: Click suggested questions for deeper exploration\n• **Quick Actions**: Use option buttons for common responses\n\nMessages include metadata about whether your persona was used for personalized responses."
  },
  {
    title: "Smart Features & Commands",
    description: "Enhanced chat capabilities and commands:\n\n• **Persona Commands**: \n  - \"hey content persona\" - Create your AI persona\n  - \"hey content update persona\" - Update existing persona\n\n• **Context Search**: Automatically finds relevant information from your content library\n• **Notepad Integration**: Save thoughts and reference notes during conversations\n• **Multi-platform Support**: Seamlessly discuss YouTube, Instagram, Gmail content\n• **Analysis Integration**: Include or exclude content analysis in discussions\n• **Session Memory**: Conversations remember context throughout the session"
  },
  {
    title: "Tips & Best Practices",
    description: "Make the most of your chat experience:\n\n• **Start with Persona**: Create your persona first for the best experience\n• **Use Specific Content**: Reference specific posts/videos by discussing them from Content Hub\n• **Enable Context Search**: Get better responses by allowing AI to search your content\n• **Organize with Notepad**: Use the integrated notepad for planning and organizing ideas\n• **New Chat for New Topics**: Start fresh conversations for different subjects\n• **Context Removal**: Remove content context when switching to general discussions\n\nYour persona makes every conversation more relevant to your unique content style and goals."
  }
];

// Instructions for updating this help content:
/*
TO UPDATE CHAT HELP:
1. Edit the chatHelp array above
2. Add new HelpPage objects for new features
3. Update existing descriptions when chat functionality changes
4. Keep persona and context information prominent as these are key differentiators

Key Chat Commands to Remember:
- "hey content persona" - Start persona creation
- "hey content write my persona" - Alternative persona creation command
- "hey content update persona" - Update existing persona

Content Context Sources:
- Instagram posts (from Content Hub or Analytics)
- YouTube videos (from Content Hub or Analytics) 
- Gmail threads (from Content Hub or Analytics)
- AI Insights (from AI Insights page)

Example of adding a new help page:
{
  title: "New Chat Feature",
  description: "Description of the new chat feature...",
  image: "/images/help/chat-feature.png" // optional
}
*/ 