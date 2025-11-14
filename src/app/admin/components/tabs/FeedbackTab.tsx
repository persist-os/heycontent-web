'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminStatsCard } from '../AdminStatsCard'
import { FeedbackFilters } from '../FeedbackFilters'

interface FeedbackTabProps {
  feedback: any
  stats: any
  users: any[]
  onFeedbackClick: (item: any) => void
}

export function FeedbackTab({ feedback, stats, users, onFeedbackClick }: FeedbackTabProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activeStatusTab, setActiveStatusTab] = useState('all')

  const handleStatusTabChange = (status: string) => {
    setActiveStatusTab(status)
    if (status === 'all') {
      setStatusFilter('all')
    } else {
      setStatusFilter(status)
    }
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setTypeFilter('all')
    setActiveStatusTab('all')
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-chart-1/10 text-chart-1 border border-chart-1/20',
      in_progress: 'bg-primary/10 text-primary border border-primary/20',
      resolved: 'bg-accent/10 text-accent border border-accent/20',
      closed: 'bg-muted text-muted-foreground',
    }
    return colors[status] || colors.new
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-muted text-muted-foreground',
      medium: 'bg-primary/10 text-primary border border-primary/20',
      high: 'bg-destructive/10 text-destructive border border-destructive/20',
    }
    return colors[priority] || colors.medium
  }

  const filteredFeedback = feedback?.feedback?.filter((item: any) => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) &&
        !item.description.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false
    if (typeFilter !== 'all' && item.type !== typeFilter) return false
    return true
  }) || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <AdminStatsCard
          label="Total Feedback"
          value={stats?.total || 0}
          icon={MessageSquare}
          onClick={() => handleStatusTabChange('all')}
          active={activeStatusTab === 'all'}
        />
        <AdminStatsCard
          label="New"
          value={stats?.byStatus?.new || 0}
          icon={MessageSquare}
          onClick={() => handleStatusTabChange('new')}
          active={activeStatusTab === 'new'}
        />
        <AdminStatsCard
          label="In Progress"
          value={stats?.byStatus?.in_progress || 0}
          icon={MessageSquare}
          onClick={() => handleStatusTabChange('in_progress')}
          active={activeStatusTab === 'in_progress'}
        />
        <AdminStatsCard
          label="Resolved"
          value={stats?.byStatus?.resolved || 0}
          icon={MessageSquare}
          onClick={() => handleStatusTabChange('resolved')}
          active={activeStatusTab === 'resolved'}
        />
        <AdminStatsCard
          label="Closed"
          value={stats?.byStatus?.closed || 0}
          icon={MessageSquare}
          onClick={() => handleStatusTabChange('closed')}
          active={activeStatusTab === 'closed'}
        />
      </div>

      <FeedbackFilters
        search={search}
        setSearch={setSearch}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onClearFilters={handleClearFilters}
        totalCount={feedback?.feedback?.length || 0}
        filteredCount={filteredFeedback.length}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {filteredFeedback.map((item: any) => (
              <div
                key={item._id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onFeedbackClick(item)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{item.title}</h3>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                      <Badge variant="outline">{item.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

