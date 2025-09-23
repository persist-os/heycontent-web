'use client'

import { FullThinkingLab } from './thinking_lab/compositions/LabCompositions'

export default function DashboardPage() {
  return (
    <div className="h-screen w-full">
      <FullThinkingLab className="h-full" />
    </div>
  )
} 