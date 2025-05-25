// File: components/settings/tabs/AIPreferencesTab.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

const aiOptions = [
  { title: 'Proactive Insights', desc: 'AI suggests opportunities without being asked' },
  { title: 'Learning Mode', desc: 'AI learns from your preferences and decisions' },
  { title: 'Automated Actions', desc: 'Allow AI to take recommended actions' },
  { title: 'Partners Insights', desc: 'Get AI-powered partnership recommendations' }
]

const AIPreferencesTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Chat With Content Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {aiOptions.map((item, i) => (
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

export default AIPreferencesTab
