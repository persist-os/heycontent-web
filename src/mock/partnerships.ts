export const mockPartnershipsData = [
  {
    id: 1,
    brand: "TechGear Pro",
    type: "Product Review",
    status: "active" as const,
    value: "$5,000",
    deadline: "2024-01-15",
    alignmentScore: 92,
    progress: 65,
    requirements: [
      "3 Instagram Posts",
      "1 YouTube Review",
      "2 Stories"
    ],
    lastContact: "2023-12-01"
  },
  {
    id: 2,
    brand: "EduLearn",
    type: "Sponsored Content",
    status: "pending" as const,
    value: "$3,500",
    deadline: "2024-02-01",
    alignmentScore: 88,
    progress: 25,
    requirements: [
      "2 YouTube Videos",
      "1 Blog Post"
    ],
    lastContact: "2023-11-28"
  }
] 