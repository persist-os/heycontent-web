import { HelpPage } from '@/components/ui/help-modal';

export const selfHubHelp: HelpPage[] = [
  {
    title: "Self Hub",
    description: "Your personal HQ. See your vibe, your stats, your journey."
  },
  {
    title: "Persona Tab",
    description: "Show off your creator style. Update your goals and audience anytime."
  },
  {
    title: "Timeline Tab",
    description: "Scroll your content life story. See what you did and when."
  },
  {
    title: "Activity Tab",
    description: "Spot your hot streaks and slow days. Find your best creative times."
  },
  {
    title: "Persona Power",
    description: "A strong persona = more fans. Keep it fresh, keep it you."
  },
  {
    title: "Activity Insights",
    description: "See what's working. Double down on your best moves."
  }
];

// Instructions for updating this help content:
/*
TO UPDATE SELF HUB HELP:
1. Edit the selfHubHelp array above
2. Add new HelpPage objects for new tabs or features
3. Update descriptions when tabs change functionality
4. Add specific feature explanations as they're developed

Example of adding help for a new tab:
{
  title: "New Tab Name",
  description: "Explanation of what this tab does...",
  image: "/images/help/self-hub-new-tab.png" // optional
}
*/ 