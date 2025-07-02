import { HelpPage } from '@/components/ui/help-modal';

export const contentHubHelp: HelpPage[] = [
  {
    title: "Welcome to Content Hub",
    description: "Content Hub is your central dashboard for managing and analyzing content across all your connected platforms. Here you can view insights, manage your content, and get AI-powered recommendations."
  },
  {
    title: "Content Hub Insights",
    description: "Get powerful AI-generated insights that analyze your content across all platforms.\n\n• Remix insights for cross-platform content ideas\n• Platform-specific hooks and formats\n• Smart summaries and conversation starters\n• Actionable recommendations for growth"
  },
  {
    title: "Connect Your Platforms",
    description: "Link your social media and communication platforms to unlock insights:\n\n• YouTube: Analyze your videos and channel performance\n• Instagram: Track posts, stories, and engagement\n• Gmail: Understand your email communication patterns\n\nYou need at least 2 platforms connected to generate Content Hub Insights."
  },
  {
    title: "Platform Views",
    description: "Switch between different views to focus on specific platforms:\n\n• All Platforms: See content from all connected platforms\n• Individual Platform Views: Focus on YouTube, Instagram, or Gmail separately\n• Posts vs AI Insights: Toggle between raw content and AI analysis"
  },
  {
    title: "Content Actions",
    description: "Take action on your content directly from the hub:\n\n• Discuss with AI: Chat about specific content pieces\n• View detailed analytics: Deep dive into performance metrics\n• Generate insights: Get AI recommendations for improvement\n• Refresh data: Keep your content up to date"
  },
  {
    title: "AI-Powered Analysis",
    description: "Our AI analyzes your content to provide:\n\n• Content themes and patterns\n• Engagement optimization suggestions\n• Cross-platform content ideas\n• Audience insights and preferences\n• Performance predictions and trends"
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