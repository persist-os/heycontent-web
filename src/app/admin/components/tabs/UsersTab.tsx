'use client'

import { Card, CardContent } from '@/components/ui/card'

interface UsersTabProps {
  users: any[]
}

export function UsersTab({ users }: UsersTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            User management interface - simplified for now
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

