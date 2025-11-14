'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, Mail } from 'lucide-react'
import { format } from 'date-fns'

export default function EmailHistory() {
  const emailHistory = useQuery(api.emailQueries.getEmailHistory, { limit: 50 })

  if (!emailHistory) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading email history...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Email History
        </CardTitle>
        <CardDescription>
          View past email sends and their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {emailHistory.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No email history yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {emailHistory.map((email: any) => (
              <div
                key={email._id}
                className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{email.subject}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(email.sentAt), 'PPpp')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {email.sentCount} sent
                    </Badge>
                    {email.filteredCount > 0 && (
                      <Badge variant="outline">
                        {email.filteredCount} filtered
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {email.recipients.length} recipient(s)
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

