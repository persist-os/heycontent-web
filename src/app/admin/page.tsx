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
  Radio,
  Activity,
  FileText,
  Save,
  X,
  Edit2,
  Trash2,
  Search
} from 'lucide-react';
import { DashboardNav } from '../dashboard/_components/dashboard-nav';
import { TestLabCard } from './components/TestLabCard';
import { AdminStatsCard } from './components/AdminStatsCard';
import { TestingHubSection } from './components/TestingHubSection';
import { FeedbackDetailModal } from './components/FeedbackDetailModal';
import { FeedbackFilters } from './components/FeedbackFilters';
import { IntelligenceTestPanel } from './components/IntelligenceTestPanel';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Id } from '@/convex/_generated/dataModel';

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
  
  // Prompts tab state
  const [promptSearch, setPromptSearch] = useState('');
  const [editingPromptId, setEditingPromptId] = useState<Id<"prompts"> | null>(null);
  const [editPromptContent, setEditPromptContent] = useState('');
  const [editPromptTags, setEditPromptTags] = useState('');
  const [editPromptDescription, setEditPromptDescription] = useState('');

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
  const prompts = useQuery(api.promptsQueries.getAllPrompts, { limit: 200 });

  const updateStatus = useMutation(api.feedback.updateFeedbackStatus);
  const updatePrompt = useMutation(api.promptsMutations.updatePromptBlock);
  const deletePrompt = useMutation(api.promptsMutations.deletePromptBlock);

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

  // Prompt handlers
  const handleEditPrompt = (prompt: any) => {
    setEditingPromptId(prompt._id);
    setEditPromptContent(prompt.content);
    setEditPromptTags(prompt.tags.join(', '));
    setEditPromptDescription(prompt.description || '');
  };

  const handleSavePrompt = async () => {
    if (!editingPromptId) return;

    try {
      await updatePrompt({
        promptId: editingPromptId,
        content: editPromptContent,
        tags: editPromptTags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        description: editPromptDescription || undefined
      });
      toast.success('Prompt updated successfully');
      setEditingPromptId(null);
    } catch (error) {
      toast.error(`Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCancelEditPrompt = () => {
    setEditingPromptId(null);
    setEditPromptContent('');
    setEditPromptTags('');
    setEditPromptDescription('');
  };

  const handleDeletePrompt = async (promptId: Id<"prompts">) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      await deletePrompt({ promptId });
      toast.success('Prompt deleted');
    } catch (error) {
      toast.error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Filter prompts
  const filteredPrompts = prompts?.filter(p => {
    if (!promptSearch) return true;
    const search = promptSearch.toLowerCase();
    return (
      p.content.toLowerCase().includes(search) ||
      p.description?.toLowerCase().includes(search) ||
      p.tags.some((tag: string) => tag.toLowerCase().includes(search)) ||
      p.type.toLowerCase().includes(search)
    );
  }) || [];

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
            <TabsList className="grid w-full grid-cols-5">
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
              <TabsTrigger value="prompts">
                <FileText className="h-4 w-4 mr-2" />
                Prompts
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

            <TabsContent value="prompts" className="space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prompts by content, tags, or type..."
                  value={promptSearch}
                  onChange={(e) => setPromptSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Total Prompts</div>
                  <div className="text-2xl font-bold text-foreground">{prompts?.length || 0}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Filtered Results</div>
                  <div className="text-2xl font-bold text-foreground">{filteredPrompts.length}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Editing</div>
                  <div className="text-2xl font-bold text-foreground">{editingPromptId ? '1' : '0'}</div>
                </Card>
              </div>

              {/* Prompts List */}
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-4">
                  {filteredPrompts.map((prompt: any) => (
                    <Card key={prompt._id} className="p-6">
                      {editingPromptId === prompt._id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                              Content
                            </label>
                            <Textarea
                              value={editPromptContent}
                              onChange={(e) => setEditPromptContent(e.target.value)}
                              rows={8}
                              className="font-mono text-sm"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                              Tags (comma-separated)
                            </label>
                            <Input
                              value={editPromptTags}
                              onChange={(e) => setEditPromptTags(e.target.value)}
                              placeholder="tag1, tag2, tag3"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                              Description (optional)
                            </label>
                            <Input
                              value={editPromptDescription}
                              onChange={(e) => setEditPromptDescription(e.target.value)}
                              placeholder="Brief description"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={handleSavePrompt} className="flex items-center gap-2">
                              <Save className="h-4 w-4" />
                              Save
                            </Button>
                            <Button onClick={handleCancelEditPrompt} variant="outline" className="flex items-center gap-2">
                              <X className="h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{prompt.type}</Badge>
                                <Badge variant="outline">{prompt.scope}</Badge>
                                {prompt.scopeId && (
                                  <Badge variant="secondary" className="text-xs">
                                    {prompt.scopeId.slice(0, 8)}...
                                  </Badge>
                                )}
                              </div>
                              {prompt.description && (
                                <p className="text-sm text-muted-foreground">{prompt.description}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleEditPrompt(prompt)}
                                variant="outline"
                                size="sm"
                              >
                                <Edit2 className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleDeletePrompt(prompt._id)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>

                          <div className="bg-muted/30 rounded-lg p-4 mb-4">
                            <pre className="text-sm whitespace-pre-wrap font-mono text-foreground">
                              {prompt.content}
                            </pre>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {prompt.tags.map((tag: string, i: number) => (
                              <Badge key={i} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-muted-foreground">Effectiveness:</span>{' '}
                              <span className="font-medium text-foreground">
                                {((prompt.effectiveness || 0) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Usage:</span>{' '}
                              <span className="font-medium text-foreground">{prompt.usageCount || 0}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Success:</span>{' '}
                              <span className="font-medium text-foreground">
                                {((prompt.successRate || 0) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Version:</span>{' '}
                              <span className="font-medium text-foreground">{prompt.version}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {filteredPrompts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No prompts found</p>
                  {promptSearch && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Try adjusting your search term
                    </p>
                  )}
                </div>
              )}
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
          users={users || []}
        />
      )}
    </div>
  );
}

