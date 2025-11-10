'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TestLogsViewProps {
  logs: string[];
}

export function TestLogsView({ logs }: TestLogsViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Execution Logs</CardTitle>
        <CardDescription>Real-time log output from test execution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Run tests to see output.</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="mb-1 whitespace-pre-wrap">{log}</div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

