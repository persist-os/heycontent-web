import { HelpPage } from '@/components/ui/help-modal';

export const chatHelp: HelpPage[] = [
  {
    title: "Chat",
    description: "Ask anything, get instant answers. It's like texting a genius."
  },
  {
    title: "Create Your Persona",
    description: "Type 'hey content persona' to make your AI get you. More you = better replies."
  },
  {
    title: "Context Magic",
    description: "Chat knows what you're talking about—posts, videos, emails. No need to explain."
  },
  {
    title: "Start Fast",
    description: "Type, tap, or pick a quick action. No wrong way to start."
  },
  {
    title: "Message Tricks",
    description: "Reply, copy, or save anything. Use suggestions for instant follow-ups."
  },
  {
    title: "Smart Commands",
    description: "Try 'hey content update persona' or let AI search your stuff. It's all about shortcuts."
  },
  {
    title: "Pro Tips",
    description: "Make a persona, use context, and keep chats short. Get more, scroll less."
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