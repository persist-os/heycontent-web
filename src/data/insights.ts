import { AIActionableInsight } from '@/types'

export const actionableInsights: AIActionableInsight[] = [
  {
    id: 1,
    type: 'content',
    opportunity: {
      title: "High-Impact Tutorial Series",
      description: "Your audience is showing strong interest in React Native content",
      impact: "2-3x normal engagement",
      timing: "Next 48 hours optimal",
      confidence: 92
    },
    action: {
      steps: [
        "Create 3-part tutorial series on React Native basics",
        "Include downloadable starter code",
        "End with common troubleshooting guide"
      ],
      timeToImplement: "2-3 days",
      expectedOutcome: "85% engagement rate, 2x subscriber growth",
      requirements: ["React Native setup", "Basic examples prepared", "Recording equipment"]
    },
    context: {
      why: [
        "Search volume up 45% this week",
        "Competitor content gap identified",
        "Your React tutorials perform 2x better"
      ],
      data: ["Search trends", "Audience requests", "Content performance"]
    }
  },
  {
    id: 2,
    type: 'platform',
    opportunity: {
      title: "TikTok Growth Opportunity",
      description: "Your tutorial style perfect for TikTok's format",
      impact: "50K-100K views potential",
      timing: "Platform algorithm favoring tech content",
      confidence: 88
    },
    action: {
      steps: [
        "Convert top YouTube tutorial to 3x60s clips",
        "Add code overlay animations",
        "Include hook in first 2 seconds"
      ],
      timeToImplement: "1 day",
      expectedOutcome: "10K new followers, cross-platform growth",
      requirements: ["Vertical video format", "Quick hooks", "Visual code examples"]
    },
    context: {
      why: [
        "Tech tutorials trending on TikTok",
        "Your teaching style matches platform",
        "Untapped audience potential"
      ],
      data: ["Platform trends", "Content analysis", "Audience overlap"]
    }
  },
  {
    id: 3,
    type: 'market',
    opportunity: {
      title: "Beginner Developer Focus",
      description: "Large audience gap in beginner-friendly content",
      impact: "40K potential new followers",
      timing: "Growing demand identified",
      confidence: 85
    },
    action: {
      steps: [
        "Create beginner-friendly content",
        "Use simple language and examples",
        "Include interactive elements"
      ],
      timeToImplement: "1-2 weeks",
      expectedOutcome: "40K new followers, increased engagement",
      requirements: ["Basic understanding of beginners", "Content planning", "Social media presence"]
    },
    context: {
      why: [
        "Growing demand for beginner content",
        "Lack of beginner-friendly content",
        "Your tutorials are popular with beginners"
      ],
      data: ["Market trends", "Content analysis", "Audience overlap"]
    }
  },
  {
    id: 4,
    type: 'content',
    opportunity: {
      title: "Email List Growth Strategy",
      description: "High conversion potential from your tutorial viewers",
      impact: "3K+ email subscribers",
      timing: "Ready to implement",
      confidence: 89
    },
    action: {
      steps: [
        "Create a follow-up email campaign",
        "Offer valuable content in exchange for email",
        "Include a clear call-to-action"
      ],
      timeToImplement: "1-2 weeks",
      expectedOutcome: "3K+ new email subscribers",
      requirements: ["Email marketing platform", "Content creation", "Email list"]
    },
    context: {
      why: [
        "High conversion rate from tutorial viewers",
        "Lack of email list growth",
        "Your tutorials are popular with viewers"
      ],
      data: ["Email marketing trends", "Content analysis", "Audience overlap"]
    }
  },
  {
    id: 5,
    type: 'platform',
    opportunity: {
      title: "Instagram Carousel Strategy",
      description: "Your technical insights perfect for visual learning",
      impact: "25K+ reach per carousel",
      timing: "Peak engagement period approaching",
      confidence: 91
    },
    action: {
      steps: [
        "Convert top tutorials to carousel slides",
        "Add visual code breakdowns",
        "Include swipeable step-by-step guides"
      ],
      timeToImplement: "3-4 days",
      expectedOutcome: "Strong Instagram growth, increased saves",
      requirements: ["Visual templates", "Code screenshots", "Carousel format"]
    },
    context: {
      why: [
        "Instagram algo favoring carousel posts",
        "High save rate on educational content",
        "Your teaching style works well visually"
      ],
      data: ["Platform trends", "Engagement analysis", "Content performance"]
    }
  },
  {
    id: 7,
    type: 'content',
    opportunity: {
      title: "Short-Form Code Tips",
      description: "Huge potential in quick problem-solving content",
      impact: "100K+ views per tip",
      timing: "Current trend peak",
      confidence: 94
    },
    action: {
      steps: [
        "Create 10 quick code solution videos",
        "Focus on common dev problems",
        "Add satisfying before/after"
      ],
      timeToImplement: "5 days",
      expectedOutcome: "Rapid follower growth across platforms",
      requirements: ["Problem collection", "Solution demos", "Visual templates"]
    },
    context: {
      why: [
        "Short-form coding content trending",
        "High search volume for solutions",
        "Perfect for cross-platform sharing"
      ],
      data: ["Platform analytics", "Search trends", "Engagement rates"]
    }
  },
  {
    id: 8,
    type: 'platform',
    opportunity: {
      title: "Twitter Thread Strategy",
      description: "Build authority with technical insights",
      impact: "50K+ impressions per thread",
      timing: "Tech Twitter very active",
      confidence: 88
    },
    action: {
      steps: [
        "Create 5 technical thread templates",
        "Share daily coding insights",
        "Engage with tech community"
      ],
      timeToImplement: "1 week",
      expectedOutcome: "Strong tech following, partnership opportunities",
      requirements: ["Content calendar", "Thread templates", "Code snippets"]
    },
    context: {
      why: [
        "Tech Twitter engagement up 40%",
        "Your thread style performing well",
        "Perfect for building authority"
      ],
      data: ["Platform metrics", "Engagement analysis", "Content testing"]
    }
  },
  {
    id: 6,
    type: 'market',
    opportunity: {
      title: "Workshop Series Opportunity",
      description: "High demand for live coding sessions",
      impact: "5K-8K revenue potential",
      timing: "Launch in 2 weeks",
      confidence: 87
    },
    action: {
      steps: [
        "Plan 4-part workshop series",
        "Create project-based curriculum",
        "Set up registration system"
      ],
      timeToImplement: "2 weeks",
      expectedOutcome: "$7K revenue, community growth",
      requirements: ["Workshop outline", "Project materials", "Marketing plan"]
    },
    context: {
      why: [
        "Competitors charging 2x more",
        "Your audience requesting live sessions",
        "Perfect for your teaching style"
      ],
      data: ["Market pricing", "Audience surveys", "Engagement metrics"]
    }
  }
  // ... continue with all other insights
] 