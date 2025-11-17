'use client'

import { Users, MessageSquare, Activity, Shield, Zap, Settings, TrendingUp } from 'lucide-react'
import { AdminStatsCard } from '../AdminStatsCard'
import { TestLabCard } from '../TestLabCard'
import { IntelligenceTestPanel } from '../IntelligenceTestPanel'

interface OverviewTabProps {
  stats: any
  users: any[]
  onTabChange: (tab: string) => void
}

export function OverviewTab({ stats, users, onTabChange }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminStatsCard
          label="Total Users"
          value={users?.length || 0}
          icon={Users}
          onClick={() => onTabChange('users')}
        />
        <AdminStatsCard
          label="Total Feedback"
          value={stats?.total || 0}
          icon={MessageSquare}
          onClick={() => onTabChange('feedback')}
        />
        <AdminStatsCard
          label="New Feedback"
          value={stats?.byStatus?.new || 0}
          icon={MessageSquare}
          onClick={() => onTabChange('feedback')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TestLabCard
          title="Living Projects Control"
          description="Real-time decision engine monitoring and manual controls"
          icon={Activity}
          colorVariant="blue"
          href="/admin/living-projects-control"
        />
        <TestLabCard
          title="Intelligence Testing"
          description="Test shard extraction, stardust, and cognitive field generation"
          icon={Shield}
          colorVariant="primary"
          onClick={() => onTabChange('testing')}
        />
        <TestLabCard
          title="Universal API Tester"
          description="Test any API route directly from the dashboard"
          icon={Zap}
          colorVariant="blue"
          onClick={() => onTabChange('testing')}
        />
        <TestLabCard
          title="Orchestration Test Lab"
          description="Test widget orchestration and dependencies"
          icon={Settings}
          colorVariant="purple"
          href="/admin/orchestration-test"
        />
        <TestLabCard
          title="Convergence Control"
          description="Self-learning optimization engine"
          icon={TrendingUp}
          colorVariant="green"
          href="/admin/convergence"
        />
      </div>

      <IntelligenceTestPanel />
    </div>
  )
}


