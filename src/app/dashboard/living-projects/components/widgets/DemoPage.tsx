'use client'

import React from 'react'
import { ProjectReveal } from './ProjectReveal'

// Sample fingerprint for demo
const demoFingerprint = {
  projectId: "demo_project",
  userId: "demo_user",
  name: "Creative Portfolio Website",
  description: "Building a stunning portfolio website to showcase creative work and attract new clients",
  domain: "creative",
  complexity_level: 7,
  collaboration_style: "solo",
  time_horizon: "project",
  primary_pattern: "iterative_creator",
  working_style: ["visual_design", "user_experience", "content_creation"],
  tangible_deliverables: ["portfolio_website", "design_system", "case_studies", "contact_form"],
  intangible_benefits: ["professional_growth", "creative_satisfaction", "client_acquisition"],
  measurement_approach: "website_traffic, client_inquiries, project_completion_milestones",
  sharing_intention: "public",
  base_personality: "creative and professional, with a focus on visual storytelling and user experience",
  project_voice: "supportive and encouraging, helping you create beautiful digital experiences",
  created_at: Date.now(),
  last_evolution: Date.now(),
  intelligence_version: "1.0",
  status: "active"
}

export default function DemoPage() {
  return (
    <ProjectReveal fingerprint={demoFingerprint} />
  )
}
