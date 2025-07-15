import { Clock, Video } from 'lucide-react'

export const mockAIInsightsData = {
  insights: [
    {
      id: 1,
      type: "Content Strategy",
      title: "Peak Engagement Times",
      description: "Your audience engagement peaks between 7-9pm EST. Consider scheduling your most important content during these hours.",
      impact: "high",
      metrics: {
        "Potential Reach": "+45%",
        "Engagement Rate": "+28%",
        "Viewer Retention": "+15%"
      },
      actionSteps: [
        "Schedule posts between 7-9pm EST",
        "Test different content formats during peak hours",
        "Monitor engagement metrics for optimization"
      ],
      icon: Clock,
      priority: "high" as const
    },
    {
      id: 2,
      type: "Audience Growth",
      title: "Content Format Analysis",
      description: "Video tutorials are outperforming other content types by a significant margin.",
      impact: "high",
      metrics: {
        "View Duration": "+65%",
        "Subscriber Growth": "+32%",
        "Comment Rate": "+48%"
      },
      actionSteps: [
        "Create more tutorial-style videos",
        "Focus on educational content",
        "Increase video production frequency"
      ],
      icon: Video,
      priority: "high" as const
    }
  ]
} 