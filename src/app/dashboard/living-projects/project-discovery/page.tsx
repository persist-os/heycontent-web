'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { Id } from '@/convex/_generated/dataModel'
import FingerprintDiscoveryComposition from './FingerprintDiscoveryComposition'

export default function ProjectDiscoveryPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId') as Id<"projects"> | null

  return (
    <FingerprintDiscoveryComposition 
      projectId={projectId || undefined} 
    />
  )
}