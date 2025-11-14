'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { useAdminAuth, useBloggerAuth } from '@/app/lib/admin-auth'
import { DashboardNav } from '../../dashboard/_components/dashboard-nav'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, ArrowLeft } from 'lucide-react'
import EmailComposer from './components/EmailComposer'
import RecipientSelector, { UserRecipient } from './components/RecipientSelector'
import EmailHistory from './components/EmailHistory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminEmailsPage() {
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const { isAdmin, isSuperAdmin } = useAdminAuth()
  const { isBlogger } = useBloggerAuth()
  const [activeTab, setActiveTab] = useState('compose')
  const [selectedRecipients, setSelectedRecipients] = useState<UserRecipient[]>([])

  // Check if user has access (blogger, admin, or super_admin)
  const hasAccess = isBlogger || isAdmin || isSuperAdmin

  if (!firebaseUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="relative flex min-h-screen">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto overflow-x-hidden ml-16 md:ml-20">
          <div className="container mx-auto p-6">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-semibold">Access Denied</h2>
                  <p className="text-muted-foreground">
                    You don't have permission to access the email dashboard.
                  </p>
                  <Button onClick={() => router.push('/dashboard')} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 overflow-y-auto overflow-x-hidden ml-16 md:ml-20">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Mail className="h-8 w-8" />
                Email Dashboard
              </h1>
              <p className="text-muted-foreground">
                Draft and send emails to users
              </p>
            </div>
            <Button onClick={() => router.push('/admin')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compose Email</CardTitle>
                  <CardDescription>
                    Draft and send emails to users. Unsubscribed users will be automatically filtered.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RecipientSelector onRecipientsChange={setSelectedRecipients} />
                  <EmailComposer recipients={selectedRecipients} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <EmailHistory />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

