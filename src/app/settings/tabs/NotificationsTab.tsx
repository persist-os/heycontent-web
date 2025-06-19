// File: components/settings/tabs/NotificationsTab.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

const notificationOptions = [
  { title: 'AI Insights', desc: 'Get notified about new AI recommendations' },
  { title: 'Performance Alerts', desc: 'Notifications about significant metrics changes' },
  { title: 'Partnership Opportunities', desc: 'Updates about new collaboration possibilities' },
  { title: 'Content Updates', desc: 'Notifications about content performance and suggestions' }
]

const NotificationsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notificationOptions.map((item, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3"
          >
            <div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
            <Switch />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default NotificationsTab
