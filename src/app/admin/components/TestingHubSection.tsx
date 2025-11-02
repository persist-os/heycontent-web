'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UniversalApiTester } from './UniversalApiTester';
import { IntelligenceTestPanel } from './IntelligenceTestPanel';
import { ArtifactTestingGround } from './ArtifactTestingGround';
import { Zap, Brain, Boxes, Settings } from 'lucide-react';

export function TestingHubSection() {
  const [activeTestTab, setActiveTestTab] = useState('api-tester');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Testing Hub</h2>
        <p className="text-muted-foreground">
          Unified testing interface for all admin testing needs
        </p>
      </div>

      <Tabs value={activeTestTab} onValueChange={setActiveTestTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-tester" className="gap-2">
            <Zap className="h-4 w-4" />
            API Tester
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="gap-2">
            <Brain className="h-4 w-4" />
            Intelligence
          </TabsTrigger>
          <TabsTrigger value="artifacts" className="gap-2">
            <Boxes className="h-4 w-4" />
            Artifacts
          </TabsTrigger>
          <TabsTrigger value="orchestration" className="gap-2">
            <Settings className="h-4 w-4" />
            Orchestration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-tester" className="space-y-4">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>Universal API Tester</CardTitle>
              </div>
              <CardDescription>
                Test any API route directly from the dashboard. Select a route, configure the request, and see results instantly.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <UniversalApiTester />
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          <Card className="border-chart-1/30 bg-gradient-to-br from-chart-1/5 to-background">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-chart-1" />
                <CardTitle>Intelligence Testing</CardTitle>
              </div>
              <CardDescription>
                Test shard extraction, stardust creation, and cognitive field generation
              </CardDescription>
            </CardHeader>
          </Card>
          
          <IntelligenceTestPanel />
        </TabsContent>

        <TabsContent value="artifacts" className="space-y-4">
          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-background">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <CardTitle>Artifact Testing Ground</CardTitle>
              </div>
              <CardDescription>
                Interactive testing for the Universal Artifact Rendering System
              </CardDescription>
            </CardHeader>
          </Card>
          
          <ArtifactTestingGround />
        </TabsContent>

        <TabsContent value="orchestration" className="space-y-4">
          <Card className="border-chart-3/30 bg-gradient-to-br from-chart-3/5 to-background">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-chart-3" />
                <CardTitle>Orchestration Tests</CardTitle>
              </div>
              <CardDescription>
                Test widget orchestration, dependencies, artifact locking, and status tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The Orchestration Test Lab provides a dedicated environment for testing complex widget workflows, 
                  dependency management, and execution orchestration.
                </p>
                <Button 
                  onClick={() => window.open('/admin/orchestration-test', '_blank')}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Open Orchestration Test Lab
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

