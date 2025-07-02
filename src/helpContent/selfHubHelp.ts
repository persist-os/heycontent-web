import { HelpPage } from '@/components/ui/help-modal';

export const selfHubHelp: HelpPage[] = [
  {
    title: "Welcome to Self Hub",
    description: "Self Hub is your personal dashboard for managing your creator persona, tracking your activity timeline, and monitoring your usage patterns across the platform."
  },
  {
    title: "Persona Tab",
    description: "Define and refine your creator identity:\n\n• Set your creator persona and brand voice\n• Define your target audience and goals\n• Customize your content style preferences\n• Update your creative objectives\n• Track persona evolution over time"
  },
  {
    title: "Timeline Tab",
    description: "View your comprehensive activity timeline:\n\n• See all your content creation activities\n• Track posts, uploads, and interactions\n• Monitor your productivity patterns\n• Review content performance over time\n• Filter timeline by platform or content type"
  },
  {
    title: "Activity Tab (Usage Heatmap)",
    description: "Analyze your platform usage patterns:\n\n• Visual heatmap of your activity levels\n• Daily, weekly, and monthly usage trends\n• Peak productivity time identification\n• Platform-specific usage statistics\n• Goal tracking and progress monitoring"
  },
  {
    title: "Persona Management",
    description: "Build a strong creator identity:\n\n• Define your unique value proposition\n• Set content themes and topics\n• Establish your brand voice and tone\n• Target audience demographics\n• Content goals and success metrics"
  },
  {
    title: "Activity Insights",
    description: "Understand your creative patterns:\n\n• Best posting times for your audience\n• Content frequency optimization\n• Productivity trend analysis\n• Platform engagement correlation\n• Performance vs. activity insights"
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