export const mockChatData = {
  history: [
    {
      id: 1,
      topic: "Content Strategy",
      preview: "Let's analyze your recent posts",
      date: "2023-12-01",
      messages: [
        {
          id: 1,
          type: "user" as const,
          content: "How can I improve my engagement?",
          timestamp: "2023-12-01T10:00:00Z"
        },
        {
          id: 2,
          type: "ai" as const,
          content: "Based on your recent posts, I notice that video content performs 45% better than images. Consider creating more video content, especially tutorials and behind-the-scenes footage.",
          timestamp: "2023-12-01T10:00:05Z"
        }
      ],
      starred: true
    },
    {
      id: 2,
      topic: "Analytics Review",
      preview: "Monthly performance analysis",
      date: "2023-11-28",
      messages: [
        {
          id: 3,
          type: "user" as const,
          content: "Show me this month's performance",
          timestamp: "2023-11-28T15:00:00Z"
        },
        {
          id: 4,
          type: "ai" as const,
          content: "Your channel has grown by 12.5% this month. Key metrics: Views up 15%, Comments up 22%, Shares up 18%.",
          timestamp: "2023-11-28T15:00:05Z"
        }
      ],
      starred: false
    }
  ]
} 