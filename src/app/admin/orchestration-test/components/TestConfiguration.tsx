'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayCircle, StopCircle, RefreshCw, Loader2 } from 'lucide-react';

interface TestConfigurationProps {
  testProjectId: string;
  setTestProjectId: (id: string) => void;
  testProjectName: string;
  setTestProjectName: (name: string) => void;
  currentUserId: string | null;
  isRunningTests: boolean;
  statusPolling: boolean;
  setStatusPolling: (polling: boolean) => void;
  onRunAllTests: () => void;
  onReset: () => void;
  existingProjects: any[];
}

export function TestConfiguration({
  testProjectId,
  setTestProjectId,
  testProjectName,
  setTestProjectName,
  currentUserId,
  isRunningTests,
  statusPolling,
  setStatusPolling,
  onRunAllTests,
  onReset,
  existingProjects
}: TestConfigurationProps) {
  const [mode, setMode] = useState<'create' | 'existing'>('existing');

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="text-lg">Test Configuration</CardTitle>
        <CardDescription>
          Full end-to-end flow: Create/Select assignment → Generate widgets → Orchestrate → Track status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Selection */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Button
            variant={mode === 'existing' ? 'default' : 'ghost'}
            onClick={() => setMode('existing')}
            className="flex-1"
            size="sm"
          >
            Use Existing Project
          </Button>
          <Button
            variant={mode === 'create' ? 'default' : 'ghost'}
            onClick={() => setMode('create')}
            className="flex-1"
            size="sm"
          >
            Create New Project
          </Button>
        </div>

        {mode === 'existing' ? (
          <div>
            <Label>Select Existing Project</Label>
            <Select
              value={testProjectId}
              onValueChange={setTestProjectId}
              disabled={isRunningTests}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a project to test..." />
              </SelectTrigger>
              <SelectContent>
                {existingProjects.map((project) => (
                  <SelectItem key={project._id} value={project._id}>
                    {project.name} ({project._id.slice(0, 8)}...)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {existingProjects.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No projects found. Create a new one instead.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>New Assignment Name</Label>
              <Input 
                value={testProjectName}
                onChange={(e) => setTestProjectName(e.target.value)}
                placeholder="Test Assignment Name"
                disabled={isRunningTests || !!testProjectId}
              />
            </div>
            <div>
              <Label>Created Project ID (auto-filled)</Label>
              <Input 
                value={testProjectId}
                readOnly
                placeholder="Will be auto-filled after creation..."
                className="font-mono bg-gray-50"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={onRunAllTests}
            disabled={!currentUserId || isRunningTests || (mode === 'existing' && !testProjectId)}
            className="gap-2 flex-1"
            size="lg"
          >
            {isRunningTests ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running Full Test Suite...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                Run Complete Flow Test
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={() => setStatusPolling(!statusPolling)}
            disabled={!testProjectId}
            className="gap-2"
          >
            {statusPolling ? (
              <>
                <StopCircle className="h-4 w-4" />
                Stop Polling
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Poll Status
              </>
            )}
          </Button>
          <Button 
            variant="destructive"
            onClick={onReset}
            disabled={isRunningTests}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

