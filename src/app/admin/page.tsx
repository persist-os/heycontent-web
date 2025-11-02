'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { useAdminAuth } from '@/app/lib/admin-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Shield, 
  MessageSquare,
  Settings,
  Zap,
  TrendingUp,
  BarChart3,
  Radio
} from 'lucide-react';
import { DashboardNav } from '../dashboard/_components/dashboard-nav';
import { TestLabCard } from './components/TestLabCard';
import { AdminStatsCard } from './components/AdminStatsCard';
import { TestingHubSection } from './components/TestingHubSection';
import { FeedbackDetailModal } from './components/FeedbackDetailModal';
import { FeedbackFilters } from './components/FeedbackFilters';
import { IntelligenceTestPanel } from './components/IntelligenceTestPanel';

// Import role styling from original
const roleColors = {
  user: 'bg-muted text-muted-foreground',
  admin: 'bg-primary/10 text-primary border border-primary/20',
  super_admin: 'bg-destructive/10 text-destructive border border-destructive/20',
  ambassador: 'bg-accent/10 text-accent border border-accent/20',
  affiliate: 'bg-chart-2/10 text-chart-2 border border-chart-2/20',
  partner: 'bg-chart-3/10 text-chart-3 border border-chart-3/20',
};

const roleIcons = {
  user: Users,
  admin: Shield,
  super_admin: Shield,
  ambassador: Users,
  affiliate: BarChart3,
  partner: BarChart3,
};

export default function AdminPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { isAdmin, isSuperAdmin } = useAdminAuth();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeStatusTab, setActiveStatusTab] = useState('all');

  // Fetch data
  const feedback = useQuery(api.feedback.listFeedback, {
    status: 'all',
    type: 'all',
    priority: 'all',
    limit: 50,
  });
  const stats = useQuery(api.feedback.getFeedbackStats);
  const users = useQuery(api.auth.getUsersWithRoles, 
    firebaseUser?.uid ? { adminUserId: firebaseUser.uid } : "skip"
  );

  const updateStatus = useMutation(api.feedback.updateFeedbackStatus);

  // Loading state
  if (firebaseUser === undefined) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Access control
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to access the admin panel.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStatusUpdate = async (
    feedbackId: string, 
    newStatus?: string, 
    newPriority?: string, 
    newAssignee?: string
  ) => {
    try {
      await updateStatus({
        feedbackId: feedbackId as any,
        status: newStatus || 'new',
        priority: newPriority,
        assignedTo: newAssignee,
      });
      
      if (selectedFeedback && selectedFeedback._id === feedbackId) {
        setSelectedFeedback({
          ...selectedFeedback,
          status: newStatus || selectedFeedback.status,
          priority: newPriority || selectedFeedback.priority,
          assignedTo: newAssignee,
        });
      }
      
      if (isModalOpen) {
        setIsModalOpen(false);
        setSelectedFeedback(null);
      }
    } catch (error) {
      console.error('Failed to update feedback:', error);
      throw error;
    }
  };

  const handleFeedbackClick = (feedbackItem: any) => {
    setSelectedFeedback(feedbackItem);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFeedback(null);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTypeFilter('all');
    setActiveStatusTab('all');
  };

  const handleStatusTabChange = (status: string) => {
    setActiveStatusTab(status);
    if (status === 'all') {
      setStatusFilter('all');
    } else {
      setStatusFilter(status);
    }
  };

  const getStatusIcon = (status: string) => {
    // Implementation from original file
    return MessageSquare;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-chart-1/10 text-chart-1 border border-chart-1/20',
      in_progress: 'bg-primary/10 text-primary border border-primary/20',
      resolved: 'bg-accent/10 text-accent border border-accent/20',
      closed: 'bg-muted text-muted-foreground',
    };
    return colors[status] || colors.new;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-muted text-muted-foreground',
      medium: 'bg-primary/10 text-primary border border-primary/20',
      high: 'bg-destructive/10 text-destructive border border-destructive/20',
    };
    return colors[priority] || colors.medium;
  };

  // Filter feedback
  const filteredFeedback = feedback?.feedback?.filter((item: any) => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) &&
        !item.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    return true;
  }) || [];

  return (
    <div className="relative flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 overflow-y-auto overflow-x-hidden ml-16 md:ml-20">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <Badge variant="outline" className="text-sm">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">
                <TrendingUp className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="feedback">
                <MessageSquare className="h-4 w-4 mr-2" />
                Feedback
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="testing">
                <Zap className="h-4 w-4 mr-2" />
                Testing Hub
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AdminStatsCard
                  label="Total Users"
                  value={users?.length || 0}
                  icon={Users}
                  onClick={() => setActiveTab('users')}
                />
                <AdminStatsCard
                  label="Total Feedback"
                  value={stats?.total || 0}
                  icon={MessageSquare}
                  onClick={() => setActiveTab('feedback')}
                />
                <AdminStatsCard
                  label="New Feedback"
                  value={stats?.byStatus?.new || 0}
                  icon={MessageSquare}
                  onClick={() => setActiveTab('feedback')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TestLabCard
                  title="Intelligence Testing"
                  description="Test shard extraction, stardust, and cognitive field generation"
                  icon={Shield}
                  colorVariant="primary"
                  onClick={() => setActiveTab('testing')}
                />
                <TestLabCard
                  title="Universal API Tester"
                  description="Test any API route directly from the dashboard"
                  icon={Zap}
                  colorVariant="blue"
                  onClick={() => setActiveTab('testing')}
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
            </TabsContent>

            <TabsContent value="feedback" className="space-y-6">
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
                    {filteredFeedback.map((item: any) => {
                      const StatusIcon = getStatusIcon(item.status);
                      return (
                        <div 
                          key={item._id} 
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => handleFeedbackClick(item)}
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
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    User management interface - simplified for now
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="testing">
              <TestingHubSection />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}

