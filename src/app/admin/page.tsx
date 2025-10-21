'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { useAdminAuth } from '@/app/lib/admin-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Shield, 
  User, 
  Settings,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Clock,
  ExternalLink,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  TrendingUp,
  Zap
} from 'lucide-react';
import { FeedbackDetailModal } from './components/FeedbackDetailModal';
import { FeedbackFilters } from './components/FeedbackFilters';
import { DashboardNav } from '../dashboard/_components/dashboard-nav';

const roleColors = {
  user: 'bg-gray-100 text-gray-800',
  admin: 'bg-purple-100 text-purple-800',
  super_admin: 'bg-red-100 text-red-800',
  ambassador: 'bg-green-100 text-green-800',
  affiliate: 'bg-blue-100 text-blue-800',
  partner: 'bg-yellow-100 text-yellow-800',
};

const roleIcons = {
  user: User,
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
  
  // All hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState('feedback');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  
  // Feedback modal state
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // User detail modal state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  // Filter and sort state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeStatusTab, setActiveStatusTab] = useState('all');
  
  // User management filters
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [userSortBy, setUserSortBy] = useState<'createdAt' | 'name' | 'totalReferred'>('createdAt');
  const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch data - all hooks called in consistent order
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
  
  // Fetch referral data for all users
  const referralData = useQuery(api.referrals.getAllReferralData, 
    firebaseUser?.uid ? {} : "skip"
  );

  // Filter and sort feedback - ALL hooks must be called before any conditional returns
  const filteredAndSortedFeedback = useMemo(() => {
    if (!feedback?.feedback) return [];
    
    let filtered = feedback.feedback;
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.userName.toLowerCase().includes(searchLower) ||
        item.userEmail.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }
    
    // Sort feedback
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [feedback, search, statusFilter, priorityFilter, typeFilter, sortBy, sortOrder]);

  // Filter and sort users - ALL hooks must be called before any conditional returns
  const filteredAndSortedUsers = useMemo(() => {
    if (!users || !referralData) return [];
    
    let filtered = users.filter((user: any) => {
      // Search filter
      const matchesSearch = user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                           user.email.toLowerCase().includes(userSearch.toLowerCase());
      
      // Role filter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      // Subscription filter
      let matchesSubscription = true;
      if (subscriptionFilter === 'subscribed') {
        matchesSubscription = user.subscription?.status === 'active';
      } else if (subscriptionFilter === 'not_subscribed') {
        matchesSubscription = !user.subscription || user.subscription.status !== 'active';
      }
      
      return matchesSearch && matchesRole && matchesSubscription;
    });
    
    // Sort users
    filtered.sort((a: any, b: any) => {
      let aValue: any, bValue: any;
      
      switch (userSortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'totalReferred':
          const aReferralData = referralData.find((r: any) => r.referrerId === a._id);
          const bReferralData = referralData.find((r: any) => r.referrerId === b._id);
          aValue = aReferralData?.totalReferred || 0;
          bValue = bReferralData?.totalReferred || 0;
          break;
        case 'createdAt':
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
      }
      
      if (userSortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [users, referralData, userSearch, roleFilter, subscriptionFilter, userSortBy, userSortOrder]);

  // Mutations - ALL hooks must be called before any conditional returns
  const updateStatus = useMutation(api.feedback.updateFeedbackStatus);
  const updateUserRole = useMutation(api.auth.updateUserRole);
  
  // Now handle conditional rendering after ALL hooks are called
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
      
      // Update the selected feedback locally to reflect changes immediately
      if (selectedFeedback && selectedFeedback._id === feedbackId) {
        setSelectedFeedback({
          ...selectedFeedback,
          status: newStatus || selectedFeedback.status,
          priority: newPriority || selectedFeedback.priority,
          assignedTo: newAssignee,
        });
      }
      
      // Close modal after successful update
      if (isModalOpen) {
        setIsModalOpen(false);
        setSelectedFeedback(null);
      }
    } catch (error) {
      console.error('Failed to update feedback:', error);
      throw error; // Re-throw to let the modal handle the error
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
  
  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };
  
  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
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
    setStatusFilter(status);
  };



  const handleRoleUpdate = async (userId: string, newRole: string) => {
    if (!firebaseUser?.uid) return;
    
    setUpdatingUser(userId);
    try {
      await updateUserRole({
        targetUserId: userId,
        newRole: newRole as any,
        adminUserId: firebaseUser.uid,
      });
    } catch (error) {
      console.error('Failed to update user role:', error);
    } finally {
      setUpdatingUser(null);
    }
  };

  const formatDate = (timestamp: number) => {
    // Handle both seconds and milliseconds
    // If timestamp is less than 10000000000, it's likely in seconds
    const timestampInMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    
    return new Date(timestampInMs).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return Clock;
      case 'in_progress': return Edit;
      case 'resolved': return CheckCircle;
      case 'closed': return Trash2;
      default: return Eye;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

          {/* Convergence Admin Quick Access */}
          <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-background dark:from-blue-950/20 dark:to-background">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <CardTitle className="text-xl">Convergence Control Panel</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Self-learning optimization engine. Trigger runs, configure systems, and monitor performance.
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => router.push('/admin/convergence')}
                  className="gap-2"
                >
                  Open Dashboard
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="space-y-6">
          {/* Feedback Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeStatusTab === 'all' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleStatusTabChange('all')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeStatusTab === 'new' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleStatusTabChange('new')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.byStatus?.new || 0}</div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeStatusTab === 'in_progress' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleStatusTabChange('in_progress')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Edit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.byStatus?.in_progress || 0}</div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeStatusTab === 'resolved' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleStatusTabChange('resolved')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.byStatus?.resolved || 0}</div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeStatusTab === 'closed' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleStatusTabChange('closed')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Closed</CardTitle>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.byStatus?.closed || 0}</div>
              </CardContent>
            </Card>
          </div>



          {/* Filters */}
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
            filteredCount={filteredAndSortedFeedback.length}
          />

          {/* Feedback List */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAndSortedFeedback.map((item) => {
                  const StatusIcon = getStatusIcon(item.status);
                  
                  return (
                    <div 
                      key={item._id} 
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
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
                            {item.screenshots && item.screenshots.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                📷 {item.screenshots.length}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>By: {item.userName}</span>
                            <span>Page: {item.page}</span>
                            <span>{formatDate(item.createdAt)}</span>
                            {item.assignedTo && (
                              <span className="text-blue-600">Assigned</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFeedbackClick(item);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredAndSortedFeedback.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {feedback?.feedback?.length === 0 ? 'No feedback found.' : 'No feedback matches your filters.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feedback Detail Modal */}
          <FeedbackDetailModal
            feedback={selectedFeedback}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onStatusUpdate={handleStatusUpdate}
            users={users || []}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Platform Overview with Tabs */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-foreground text-xl font-semibold">Platform Overview</CardTitle>
              <CardDescription className="text-muted-foreground">
                Key metrics for your HeyContext platform
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Overview Tabs */}
              <Tabs defaultValue="metrics" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted border border-border">
                  <TabsTrigger 
                    value="metrics" 
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Metrics
                  </TabsTrigger>
                  <TabsTrigger 
                    value="users" 
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <Users className="h-4 w-4" />
                    Users
                  </TabsTrigger>
                  <TabsTrigger 
                    value="referrals" 
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Referrals
                  </TabsTrigger>
                  <TabsTrigger 
                    value="revenue" 
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Revenue
                  </TabsTrigger>
                </TabsList>

                {/* Metrics Tab */}
                <TabsContent value="metrics" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 rounded-lg bg-muted/50 border border-border transition-all duration-200 hover:bg-muted/70">
                      <div className="text-3xl font-bold text-foreground">
                        {users?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50 border border-border transition-all duration-200 hover:bg-muted/70">
                      <div className="text-3xl font-bold text-primary">
                        {users?.filter(u => u.subscription?.status === 'active').length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Subscribers</div>
                      <div className="text-xs text-primary mt-1 font-medium">
                        {users?.length ? Math.round((users.filter(u => u.subscription?.status === 'active').length / users.length) * 100) : 0}% conversion rate
                      </div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50 border border-border transition-all duration-200 hover:bg-muted/70">
                      <div className="text-3xl font-bold text-accent">
                        {referralData?.reduce((total, r) => total + r.totalReferred, 0) || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Referrals</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Across all users
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50 border border-border transition-all duration-200 hover:bg-muted/70">
                      <div className="text-2xl font-bold text-foreground">
                        {users?.filter(u => u.role === 'user').length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Regular Users</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50 border border-border transition-all duration-200 hover:bg-muted/70">
                      <div className="text-2xl font-bold text-accent">
                        {users?.filter(u => ['admin', 'super_admin'].includes(u.role)).length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Admin Users</div>
                      <div className="text-xs text-accent mt-1 font-medium">
                        Admin: {users?.filter(u => u.role === 'admin').length || 0} | 
                        Super: {users?.filter(u => u.role === 'super_admin').length || 0}
                      </div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50 border border-border transition-all duration-200 hover:bg-muted/70">
                      <div className="text-2xl font-bold text-primary">
                        {users?.filter(u => ['ambassador', 'affiliate', 'partner'].includes(u.role)).length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Tier Users</div>
                      <div className="text-xs text-primary mt-1 font-medium">
                        A: {users?.filter(u => u.role === 'ambassador').length || 0} | 
                        F: {users?.filter(u => u.role === 'affiliate').length || 0} | 
                        P: {users?.filter(u => u.role === 'partner').length || 0}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Referrals Tab */}
                <TabsContent value="referrals" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50 border border-border transition-all duration-200 hover:bg-muted/70">
                      <div className="text-2xl font-bold text-foreground">
                        {referralData?.reduce((total, r) => total + r.totalReferred, 0) || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Referrals</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50 border border-border transition-all duration-200 hover:bg-muted/70">
                      <div className="text-2xl font-bold text-primary">
                        {(() => {
                          if (!users || !referralData) return 0;
                          let totalReferredUsers = 0;
                          let payingReferredUsers = 0;
                          
                          referralData.forEach(r => {
                            r.referredUsers.forEach((ref: any) => {
                              totalReferredUsers++;
                              const referredUser = users.find(u => u._id === ref.userId);
                              if (referredUser?.subscription?.status === 'active') {
                                payingReferredUsers++;
                              }
                            });
                          });
                          
                          return totalReferredUsers > 0 ? Math.round((payingReferredUsers / totalReferredUsers) * 100) : 0;
                        })()}%
                      </div>
                      <div className="text-sm text-muted-foreground">Referral Conversion</div>
                      <div className="text-xs text-primary mt-1 font-medium">
                        % of referred users who subscribed
                      </div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50 border border-border transition-all duration-200 hover:bg-muted/70">
                      <div className="text-2xl font-bold text-accent">
                        {referralData?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Referrers</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Users with referrals
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Revenue Tab */}
                <TabsContent value="revenue" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50 border border-border transition-all duration-200 hover:bg-muted/70">
                      <div className="text-2xl font-bold text-primary">
                        {users?.filter(u => u.subscription?.status === 'active').length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Subscriptions</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50 border border-border transition-all duration-200 hover:bg-muted/70">
                      <div className="text-2xl font-bold text-accent">
                        {users?.filter(u => u.subscription?.status === 'active' && u.subscription?.plan?.includes('pro')).length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Pro Plans</div>
                      <div className="text-xs text-accent mt-1 font-medium">
                        High-tier subscribers
                      </div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50 border border-border transition-all duration-200 hover:bg-muted/70">
                      <div className="text-2xl font-bold text-foreground">
                        {users?.filter(u => u.subscription?.status === 'active' && u.subscription?.plan?.includes('basic')).length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Basic Plans</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Entry-level subscribers
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* User List */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="mb-6 space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {/* Filters and Sorting */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Role Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="ambassador">Ambassador</SelectItem>
                        <SelectItem value="affiliate">Affiliate</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Subscription Filter */}
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="All Users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="subscribed">Subscribers Only</SelectItem>
                        <SelectItem value="not_subscribed">Non-Subscribers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Sort By */}
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4 text-muted-foreground" />
                    <Select value={userSortBy} onValueChange={(value: 'createdAt' | 'name' | 'totalReferred') => setUserSortBy(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Date Joined</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="totalReferred">Total Referrals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Sort Order */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUserSortOrder(userSortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-2"
                  >
                    {userSortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    {userSortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  </Button>
                  
                  {/* Clear Filters */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUserSearch('');
                      setRoleFilter('all');
                      setSubscriptionFilter('all');
                      setUserSortBy('createdAt');
                      setUserSortOrder('desc');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
                
                {/* Results Count */}
                <div className="text-sm text-muted-foreground">
                  Showing {filteredAndSortedUsers.length} of {users?.length || 0} users
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredAndSortedUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No users found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  filteredAndSortedUsers.map((user) => {
                    const RoleIcon = roleIcons[user.role as keyof typeof roleIcons] || User;
                    
                    return (
                      <div 
                        key={user._id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleUserClick(user)}
                      >
                        <div className="flex items-center gap-4">
                          <RoleIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h3 className="font-semibold">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined: {formatDate(user.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Subscription Status */}
                          {user.subscription?.status === 'active' ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Subscribed
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-600 text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {user.subscription ? user.subscription.status : 'No Plan'}
                            </Badge>
                          )}
                          
                          <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                          
                          {/* Show referral stats if they exist */}
                          {(() => {
                            const userReferralData = referralData?.find(r => r.referrerId === user._id);
                            if (userReferralData && userReferralData.totalReferred > 0) {
                              return (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-green-600 font-medium">
                                    {userReferralData.totalReferred} referrals
                                  </span>
                                  {userReferralData.lastReferralDate && (
                                    <span className="text-muted-foreground">
                                      {formatDate(userReferralData.lastReferralDate)}
                                    </span>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {isSuperAdmin && (
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleRoleUpdate(user._id, value)}
                              disabled={updatingUser === user._id}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                                <SelectItem value="ambassador">Ambassador</SelectItem>
                                <SelectItem value="affiliate">Affiliate</SelectItem>
                                <SelectItem value="partner">Partner</SelectItem>
                              </SelectContent>
                            </Select>
                          )}

                          {updatingUser === user._id && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                              Updating...
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* User Detail Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">User Details: {selectedUser.name}</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCloseUserModal}
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    ✕
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Name</label>
                      <p className="text-sm text-white">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Email</label>
                      <p className="text-sm text-white">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Role</label>
                      <p className="text-sm text-white">{selectedUser.role?.replace('_', ' ') || 'user'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Joined</label>
                      <p className="text-sm text-white">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                  </div>
                  
                  {/* Subscription Status */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-3 text-white">Subscription Status</h3>
                    {selectedUser.subscription ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-300">Status</label>
                          <div className="flex items-center gap-2">
                            {selectedUser.subscription.status === 'active' ? (
                              <Badge className="bg-green-600 text-white">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-600 text-white">
                                <Clock className="h-3 w-3 mr-1" />
                                {selectedUser.subscription.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-300">Plan</label>
                          <p className="text-sm text-white">{selectedUser.subscription.plan?.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-300">Current Period</label>
                          <p className="text-sm text-white">
                            {formatDate(selectedUser.subscription.currentPeriodStart)} - {formatDate(selectedUser.subscription.currentPeriodEnd)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-300">Usage</label>
                          <p className="text-sm text-white">
                            {selectedUser.subscription.usedRequests} / {selectedUser.subscription.includedRequests} requests
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-400">No active subscription</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Referral Stats */}
                  {(() => {
                    // Find referral data for this user
                    const userReferralData = referralData?.find(r => r.referrerId === selectedUser._id);
                    
                    if (userReferralData && userReferralData.totalReferred > 0) {
                      // Calculate referral quality metrics
                      const referredUsers = userReferralData.referredUsers;
                      const payingReferrals = referredUsers.filter((ref: any) => {
                        const referredUser = users?.find(u => u._id === ref.userId);
                        return referredUser?.subscription?.status === 'active';
                      });
                      const conversionRate = Math.round((payingReferrals.length / referredUsers.length) * 100);
                      
                      return (
                        <div className="border-t pt-4">
                          <h3 className="text-lg font-medium mb-3 text-white">Referral Statistics</h3>
                          <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-400">
                                {userReferralData.totalReferred}
                              </div>
                              <div className="text-sm text-gray-300">Total Referrals</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-400">
                                {payingReferrals.length}
                              </div>
                              <div className="text-sm text-gray-300">Paying Users</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-400">
                                {conversionRate}%
                              </div>
                              <div className="text-sm text-gray-300">Conversion Rate</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-300">
                                {userReferralData.lastReferralDate ? 
                                  formatDate(userReferralData.lastReferralDate) : 'N/A'
                                }
                              </div>
                              <div className="text-sm text-gray-300">Last Referral</div>
                            </div>
                          </div>
                          
                          {/* Referred Users List */}
                          <div className="mt-4">
                            <h4 className="text-md font-medium mb-2 text-white">Referred Users:</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {userReferralData.referredUsers.map((referredUser: any, index: number) => {
                                const referredUserData = users?.find(u => u._id === referredUser.userId);
                                const isPaying = referredUserData?.subscription?.status === 'active';
                                
                                return (
                                  <div key={index} className="bg-gray-800 border border-gray-700 p-3 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="font-medium text-white">{referredUserData?.name || 'Unknown User'}</div>
                                          {isPaying ? (
                                            <Badge className="bg-green-600 text-white text-xs">
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                              Paying
                                            </Badge>
                                          ) : (
                                            <Badge className="bg-green-600 text-white text-xs">
                                              <Clock className="h-3 w-3 mr-1" />
                                              {referredUserData?.subscription?.status || 'No Plan'}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-sm text-gray-300">{referredUserData?.email || 'No email'}</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                          Referred: {formatDate(referredUser.referredAt)}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm text-gray-300">
                                          Code: {referredUser.referralCode}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Referral Code */}
                  {selectedUser.referralCode && (
                    <div className="border-t border-gray-700 pt-4">
                      <h3 className="text-lg font-medium mb-3 text-white">Referral Code</h3>
                      <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg">
                        <code className="text-lg font-mono text-green-400">{selectedUser.referralCode}</code>
                      </div>
                    </div>
                  )}
                  
                  {/* Referred By */}
                  {selectedUser.referredBy && (
                    <div className="border-t border-gray-700 pt-4">
                      <h3 className="text-lg font-medium mb-3 text-white">Referred By</h3>
                      <p className="text-sm text-gray-300">{selectedUser.referredBy}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>


      </Tabs>
        </div>
      </main>
    </div>
  );
} 