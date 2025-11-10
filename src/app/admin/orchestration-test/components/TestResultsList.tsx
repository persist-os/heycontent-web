'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'running' | 'pending';
  message?: string;
  duration?: number;
}

interface TestResultsListProps {
  testResults: TestResult[];
  testProjectId: string;
  onRunTest: (testId: string) => void;
}

const TEST_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  test1: {
    title: 'Create Assignment & Fingerprint',
    description: 'Create new project and initialize fingerprint'
  },
  test1_5: {
    title: 'Generate Widgets',
    description: 'AI-powered widget generation from fingerprint'
  },
  test2: {
    title: 'Start Assignment Orchestration',
    description: 'Queue widgets with dependencies'
  },
  test3: {
    title: 'Redis Status Tracking',
    description: 'Verify status aggregation from Redis'
  },
  test4: {
    title: 'Widget Question Storage',
    description: 'Check Convex question persistence'
  },
  test6: {
    title: 'Artifact Collaboration',
    description: 'Check multi-widget artifact updates'
  }
};

export function TestResultsList({ testResults, testProjectId, onRunTest }: TestResultsListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Suite Results</CardTitle>
        <CardDescription>Individual test results for orchestration components</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {testResults.map((result) => {
          const testInfo = TEST_DESCRIPTIONS[result.test];
          if (!testInfo) return null;

          return (
            <div key={result.test} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <p className="font-medium">{testInfo.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {result.message || testInfo.description}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onRunTest(result.test)}
                disabled={!testProjectId && result.test !== 'test1'}
              >
                Run
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

