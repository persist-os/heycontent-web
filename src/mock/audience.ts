export const mockAudienceData = {
  id: 1,
  name: "Channel Analytics",
  demographics: {
    age: 25,
    location: "United States",
    interests: ["Technology", "Gaming", "Education"],
    ageGroups: [
      { name: "18-24", value: 35 },
      { name: "25-34", value: 45 },
      { name: "35-44", value: 15 },
      { name: "45+", value: 5 }
    ]
  },
  engagement: {
    views: 125000,
    likes: 25000,
    comments: 3000,
    metrics: [
      { name: "Views", value: 125000 },
      { name: "Likes", value: 25000 },
      { name: "Comments", value: 3000 },
      { name: "Shares", value: 1500 }
    ]
  },
  growth: {
    followers: 50000,
    rate: 12.5,
    history: [
      { date: "2023-01", followers: 45000 },
      { date: "2023-02", followers: 46500 },
      { date: "2023-03", followers: 48000 },
      { date: "2023-04", followers: 50000 }
    ]
  }
} 