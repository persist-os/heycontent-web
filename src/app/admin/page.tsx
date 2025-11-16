'use client'

import { useState } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { useAdminAuth } from '@/app/lib/admin-auth'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Shield, MessageSquare, Zap, TrendingUp, FileText, Mail } from 'lucide-react'
import { DashboardNav } from '../dashboard/_components/dashboard-nav'
import { TestingHubSection } from './components/TestingHubSection'
import { FeedbackDetailModal } from './components/FeedbackDetailModal'
import { OverviewTab } from './components/tabs/OverviewTab'
import { FeedbackTab } from './components/tabs/FeedbackTab'
import { UsersTab } from './components/tabs/UsersTab'
import { PromptsTab } from './components/tabs/PromptsTab'
import { BlogPostsTab } from './components/tabs/BlogPostsTab'
import { useAdminData } from './hooks/useAdminData'
import { useFeedbackHandlers } from './hooks/useFeedbackHandlers'

export default function AdminPage() {
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const { isAdmin, isSuperAdmin } = useAdminAuth()
  const [activeTab, setActiveTab] = useState('overview')

  // Data and mutations
  const { currentUserId, feedback, stats, users, prompts, blogPosts, mutations } = useAdminData()

  // Feedback handlers
  const {
    selectedFeedback,
    isModalOpen,
    handleStatusUpdate,
    handleFeedbackClick,
    handleCloseModal,
  } = useFeedbackHandlers(mutations.updateStatus)

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
    )
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
    )
  }

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
            <TabsList className="grid w-full grid-cols-7">
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
              <TabsTrigger value="blog-posts">
                <FileText className="h-4 w-4 mr-2" />
                Blog Posts
              </TabsTrigger>
              <TabsTrigger value="emails" onClick={() => router.push('/admin/emails')}>
                <Mail className="h-4 w-4 mr-2" />
                Emails
              </TabsTrigger>
              <TabsTrigger value="testing">
                <Zap className="h-4 w-4 mr-2" />
                Testing Hub
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <OverviewTab stats={stats} users={users || []} onTabChange={setActiveTab} />
            </TabsContent>

            <TabsContent value="feedback" className="space-y-6">
              <FeedbackTab
                feedback={feedback}
                stats={stats}
                users={users || []}
                onFeedbackClick={handleFeedbackClick}
              />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <UsersTab users={users || []} />
            </TabsContent>

            <TabsContent value="prompts" className="space-y-6">
              <PromptsTab
                prompts={prompts || []}
                updatePrompt={mutations.updatePrompt}
                deletePrompt={mutations.deletePrompt}
              />
            </TabsContent>

            <TabsContent value="blog-posts" className="space-y-6">
              <BlogPostsTab
                blogPosts={blogPosts || []}
                currentUserId={currentUserId}
                updateBlogPost={mutations.updateBlogPost}
                deleteBlogPost={mutations.deleteBlogPost}
                publishBlogPost={mutations.publishBlogPost}
                createBlogPost={mutations.createBlogPost}
              />
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
  )
}

