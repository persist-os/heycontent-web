import { HelpPage } from '@/components/ui/help-modal';

export const contentHubHelp: HelpPage[] = [
  {
    title: "What's Content Hub?",
    description: "See all your stuff from every platform in one spot. No more app-hopping."
  },
  {
    title: "AI Insights",
    description: "Get instant ideas and tips from AI. It's like having a creative sidekick."
  },
  {
    title: "Connect Platforms",
    description: "Plug in your socials and email. More connections = more insights."
  },
  {
    title: "Switch Views",
    description: "Jump between YouTube, Insta, Gmail, or see everything at once. Your feed, your rules."
  },
  {
    title: "Take Action",
    description: "Chat with AI, check stats, or refresh your data. Do it all right here."
  },
  {
    title: "Why AI?",
    description: "AI spots trends and gives you ideas you'd never think of. Work smarter, not harder."
  }
];

// Instructions for updating this help content:
/*
TO UPDATE CONTENT HUB HELP:
1. Edit the contentHubHelp array above
2. Add new HelpPage objects with title and description
3. Optionally add images by setting the image property to a path
4. For complex content, use the content property with JSX

Example of adding a new help page:
{
  title: "New Feature Name",
  description: "Explanation of the new feature...",
  image: "/images/help/content-hub-new-feature.png" // optional
}
*/ 