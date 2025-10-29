'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchWithApiKey, getCurrentUserId } from '@/app/lib/api-helpers';

type TestRunResult = {
  success: boolean;
  job_ids?: string[];
  entity_types_processed?: string[];
  message?: string;
  error?: string;
};

const DEFAULT_CONTENT =
  'Admin test content: validate shard, stardust, and cognitive field creation.';

export function IntelligenceTestPanel() {
  const [userId, setUserId] = useState('');
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestRunResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    getCurrentUserId()
      .then((uid) => {
        if (uid && isMounted) {
          setUserId(uid);
        }
      })
      .catch(() => {
        // Swallow error; user can still trigger run which re-attempts lookup.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRun = async () => {
    setLoading(true);
    setResult(null);

    try {
      let resolvedUserId = userId;

      if (!resolvedUserId) {
        try {
          resolvedUserId = await getCurrentUserId();
          setUserId(resolvedUserId);
        } catch (idError: any) {
          setResult({
            success: false,
            error:
              idError?.message ||
              'Failed to determine current user. Please ensure you are signed in.',
          });
          return;
        }
      }

      const response = await fetchWithApiKey('/api/admin/intelligence/test-run', {
        method: 'POST',
        body: JSON.stringify({
          user_id: resolvedUserId,
          content,
        }),
      });

      let data: TestRunResult;
      try {
        data = (await response.json()) as TestRunResult;
      } catch (parseError) {
        data = {
          success: false,
          error: response.ok
            ? 'Unexpected response format'
            : `Request failed with status ${response.status}`,
        };
      }
      setResult(
        response.ok
          ? data
          : {
              success: false,
              error: data?.error || `Request failed with status ${response.status}`,
              job_ids: data?.job_ids,
              entity_types_processed: data?.entity_types_processed,
            },
      );
    } catch (error: any) {
      setResult({
        success: false,
        error: error?.message || 'Failed to trigger orchestrator',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/30 shadow-sm">
      <CardHeader>
        <CardTitle>Intelligence Orchestrator Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="intelligence-user-id">User ID</Label>
          <Input
            id="intelligence-user-id"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Enter user ID"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="intelligence-content">Content</Label>
          <Textarea
            id="intelligence-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={4}
          />
        </div>

        <Button onClick={handleRun} disabled={loading}>
          {loading ? 'Running orchestrator...' : 'Trigger Orchestrator'}
        </Button>

        {result && (
          <div className="space-y-2 rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={result.success ? 'default' : 'destructive'}>
                {result.success ? 'Success' : 'Failed'}
              </Badge>
              <span>{result.message || result.error || 'No message'}</span>
            </div>

            {result.job_ids?.length ? (
              <div>
                <Label>Triggered Jobs</Label>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {result.job_ids.map((jobId) => (
                    <li key={jobId} className="break-all font-mono text-xs">
                      {jobId}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.entity_types_processed?.length ? (
              <div className="flex flex-wrap gap-2">
                {result.entity_types_processed.map((entity) => (
                  <Badge key={entity} variant="outline">
                    {entity}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
