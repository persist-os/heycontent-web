'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useGmailAuth } from '@/app/hooks/useGmailAuth'
import { Mail, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/components/translation/T'

interface ConnectionsTabProps {
  userId?: string
}

const ConnectionsTab = ({ userId }: ConnectionsTabProps) => {
  const { isAuthenticated, isLoading, isConnecting, connectGmail } = useGmailAuth()
  const disconnectGmail = useMutation(api.gmailMutations.disconnectGmail)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const handleConnectGmail = async () => {
    if (!userId) {
      toast.error('User ID required to connect Gmail')
      return
    }

    try {
      // connectGmail() opens OAuth popup and handles the flow
      // Note: Page will reload after successful auth, so success toast won't show
      // User will see updated status after reload
      await connectGmail(window.location.href)
    } catch (error) {
      // Handle errors (popup blocked, timeout, network errors, etc.)
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect Gmail'
      toast.error(errorMessage)
      console.error('Gmail connection error:', error)
    }
  }

  const handleDisconnectGmail = async () => {
    if (!userId) {
      toast.error('User ID required to disconnect Gmail')
      return
    }

    setIsDisconnecting(true)
    try {
      await disconnectGmail({ userId })
      toast.success('Gmail disconnected successfully')
      // Reload page to refresh auth state
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect Gmail')
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          <T context="settings.connections.title">Platform Connections</T>
        </h2>
        <p className="text-muted-foreground">
          <T context="settings.connections.subtitle">Connect your accounts to enable features and integrations</T>
        </p>
      </div>

      {/* Gmail Connection Card */}
      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <Mail className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-foreground">
                  <T context="settings.connections.gmail.title">Gmail</T>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  <T context="settings.connections.gmail.description">Connect your Gmail account to send emails through Heycontext</T>
                </CardDescription>
                <div className="flex items-center gap-2 mt-3">
                  {isLoading ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      <T context="settings.connections.status.loading">Checking...</T>
                    </Badge>
                  ) : isAuthenticated ? (
                    <Badge variant="success" className="bg-green-500/10 text-green-600 dark:text-green-400 border-0">
                      <CheckCircle2 className="w-3 h-3 mr-1.5" />
                      <T context="settings.connections.status.connected">Connected</T>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <XCircle className="w-3 h-3 mr-1.5" />
                      <T context="settings.connections.status.not_connected">Not Connected</T>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              {isAuthenticated ? (
                <Button
                  variant="destructive"
                  onClick={handleDisconnectGmail}
                  disabled={isDisconnecting}
                  className="flex items-center gap-2"
                >
                  {isDisconnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <T context="settings.connections.disconnecting">Disconnecting...</T>
                    </>
                  ) : (
                    <T context="settings.connections.disconnect">Disconnect</T>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleConnectGmail}
                  disabled={isConnecting || isLoading || !userId}
                  className="flex items-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <T context="settings.connections.connecting">Connecting...</T>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <T context="settings.connections.connect_gmail">Connect Gmail</T>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Coming Soon - Other Platforms */}
      <Card className="border-dashed opacity-60">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              <T context="settings.connections.coming_soon">More Connections Coming Soon</T>
            </h3>
            <p className="text-sm text-muted-foreground">
              <T context="settings.connections.coming_soon.subtitle">We're working on additional platform integrations.</T>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ConnectionsTab

