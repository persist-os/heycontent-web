// File: components/settings/tabs/DataTab.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Switch } from '@/src/components/ui/switch'
import { Download } from 'lucide-react'
import { Button } from '@/src/components/ui/button'

const DataTab = () => {
  return (
    <div className="grid gap-4 sm:gap-6 max-w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Data Export & Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
            <div>
              <h3 className="font-medium">Export All Data</h3>
              <p className="text-sm text-gray-600">Download all your data in a single file</p>
            </div>
            <Button className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
            <div>
              <h3 className="font-medium">Automatic Backups</h3>
              <p className="text-sm text-gray-600">Keep your data safe with regular backups</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Privacy & Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
            <div>
              <h3 className="font-medium">Data Collection</h3>
              <p className="text-sm text-gray-600">Manage what data is collected and analyzed</p>
            </div>
            <Button variant="outline">Configure</Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
            <div>
              <h3 className="font-medium">Clear Data</h3>
              <p className="text-sm text-gray-600">Delete all stored data and preferences</p>
            </div>
            <Button variant="destructive">Clear All</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DataTab
