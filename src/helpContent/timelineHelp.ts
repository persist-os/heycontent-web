import { HelpPage } from '@/components/ui/help-modal';

export const timelineHelp: HelpPage[] = [
  {
    title: "Welcome to Timeline",
    description: "Timeline provides a chronological view of all your content creation activities across connected platforms. Track your productivity, review your content journey, and identify patterns in your creative workflow."
  },
  {
    title: "Content Timeline View",
    description: "See your entire content history:\n\n• Chronological feed of all your content\n• Posts, uploads, and activities from all platforms\n• Visual timeline with dates and timestamps\n• Content thumbnails and previews\n• Platform-specific icons and indicators"
  },
  {
    title: "Filtering & Navigation",
    description: "Find specific content quickly:\n\n• Filter by platform (YouTube, Instagram, Gmail)\n• Filter by content type (videos, posts, emails)\n• Date range selection\n• Search within timeline content\n• Jump to specific time periods"
  },
  {
    title: "Content Interaction",
    description: "Engage with your timeline content:\n\n• Click to view full content details\n• Quick actions for each content piece\n• Share or discuss content with AI\n• Add notes or tags to timeline items\n• Export timeline data"
  },
  {
    title: "Productivity Insights",
    description: "Understand your creative patterns:\n\n• Identify your most productive periods\n• Track content frequency and consistency\n• Analyze posting patterns across platforms\n• Monitor content performance trends\n• Spot gaps in your content schedule"
  },
  {
    title: "Timeline Features",
    description: "Make the most of your timeline:\n\n• Infinite scroll through your content history\n• Responsive design for mobile and desktop\n• Real-time updates as you create new content\n• Export timeline for external analysis\n• Integration with notes and insights"
  }
];

// Instructions for updating this help content:
/*
TO UPDATE TIMELINE HELP:
1. Edit the timelineHelp array above
2. Add new HelpPage objects for new timeline features
3. Update filtering options when new filters are added
4. Add explanations for new timeline interactions

Example of adding a new help page:
{
  title: "New Timeline Feature",
  description: "Description of the new timeline feature...",
  image: "/images/help/timeline-feature.png" // optional
}
*/ 