import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';

interface TestResult {
  id: string;
  promptId: string;
  output: string;
  rating: number;
  feedback: string;
  timestamp: string;
}

interface PromptTestHistoryProps {
  testResults: TestResult[];
  selectedPromptId: string | null;
}

export function PromptTestHistory({ testResults, selectedPromptId }: PromptTestHistoryProps) {
  const filtered = testResults.filter(r => r.promptId === selectedPromptId).reverse();
  if (filtered.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test History</CardTitle>
        <CardDescription>
          Previous test results for this prompt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {filtered.map(result => (
            <div key={result.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StarRating
                    value={result.rating}
                    onChange={() => {}}
                    disabled
                    size="sm"
                  />
                  <span className="text-sm text-gray-600">
                    {new Date(result.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {result.feedback && (
                <p className="text-sm text-gray-700">{result.feedback}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 