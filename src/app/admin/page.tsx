'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { useAdminAuth } from '@/app/lib/admin-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ExternalLink
} from 'lucide-react';
import { FeedbackDetailModal } from './components/FeedbackDetailModal';
import { FeedbackFilters } from './components/FeedbackFilters';
import { DashboardNav } from '../dashboard/_components/dashboard-nav';

const roleColors = {
  user: 'bg-gray-100 text-gray-800',
  admin: 'bg-purple-100 text-purple-800',
  super_admin: 'bg-red-100 text-red-800',
};

const roleIcons = {
  user: User,
  admin: Shield,
  super_admin: Shield,
};

export default function AdminPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { isAdmin, isSuperAdmin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('feedback');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  
  // Feedback modal state
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filter and sort state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeStatusTab, setActiveStatusTab] = useState('all');

  // Fetch data - always call hooks, even if we'll return early
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

  // Mutations
  const updateStatus = useMutation(api.feedback.updateFeedbackStatus);
  const updateUserRole = useMutation(api.auth.updateUserRole);

  // Check access
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

  // Filter and sort feedback
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
    
    // Apply status filter (exclude resolved/closed unless specifically requested)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    } else {
      // By default, exclude resolved and closed items unless viewing all
      filtered = filtered.filter(item => item.status !== 'resolved' && item.status !== 'closed');
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case 'updatedAt':
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'priority':
          aValue = a.priority;
          bValue = b.priority;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'userName':
          aValue = a.userName.toLowerCase();
          bValue = b.userName.toLowerCase();
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [feedback?.feedback, search, statusFilter, priorityFilter, typeFilter, sortBy, sortOrder]);

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
    return new Date(timestamp).toLocaleDateString('en-US', {
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
          {/* User Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users?.filter(u => u.role === 'admin').length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users?.filter(u => u.role === 'super_admin').length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users?.filter(u => u.role === 'user').length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User List */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users?.map((user) => {
                  const RoleIcon = roleIcons[user.role as keyof typeof roleIcons] || User;
                  
                  return (
                    <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
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
                        <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                          {user.role.replace('_', ' ')}
                        </Badge>

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
                })}

                {users?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </main>
    </div>
  );
} 