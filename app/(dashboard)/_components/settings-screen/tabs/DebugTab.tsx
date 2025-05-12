// File: components/settings/tabs/DebugTab.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'

const DebugTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Debug Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-1">Debug Log</h3>
            <pre className="text-xs whitespace-pre-wrap text-gray-800">[live log output will appear here]</pre>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-1">System Info</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>App Version: 1.0.0</li>
              <li>Build Timestamp: {new Date().toLocaleString()}</li>
              <li>Environment: {process.env.NODE_ENV}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DebugTab