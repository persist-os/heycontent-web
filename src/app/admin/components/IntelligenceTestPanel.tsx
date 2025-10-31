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

type CognitiveFieldResult = {
  success: boolean;
  field_id?: string;
  message?: string;
  shards_used?: number;
  stardust_used?: number;
  error?: string;
};

const DEFAULT_CONTENT =
  'Admin test content: validate shard, stardust, and cognitive field creation.';

export function IntelligenceTestPanel() {
  const [userId, setUserId] = useState('');
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestRunResult | null>(null);
  const [cognitiveFieldLoading, setCognitiveFieldLoading] = useState(false);
  const [cognitiveFieldResult, setCognitiveFieldResult] = useState<CognitiveFieldResult | null>(null);

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

  const handleGenerateCognitiveField = async () => {
    setCognitiveFieldLoading(true);
    setCognitiveFieldResult(null);

    try {
      let resolvedUserId = userId;

      if (!resolvedUserId) {
        try {
          resolvedUserId = await getCurrentUserId();
          setUserId(resolvedUserId);
        } catch (idError: any) {
          setCognitiveFieldResult({
            success: false,
            error:
              idError?.message ||
              'Failed to determine current user. Please ensure you are signed in.',
          });
          return;
        }
      }

      const response = await fetchWithApiKey(
        '/api/admin/intelligence/generate-cognitive-field',
        {
          method: 'POST',
          body: JSON.stringify({
            user_id: resolvedUserId,
          }),
        }
      );

      let data: CognitiveFieldResult;
      try {
        data = (await response.json()) as CognitiveFieldResult;
      } catch (parseError) {
        data = {
          success: false,
          error: response.ok
            ? 'Unexpected response format'
            : `Request failed with status ${response.status}`,
        };
      }

      setCognitiveFieldResult(
        response.ok
          ? data
          : {
              success: false,
              error: data?.error || `Request failed with status ${response.status}`,
            }
      );
    } catch (error: any) {
      setCognitiveFieldResult({
        success: false,
        error: error?.message || 'Failed to generate cognitive field',
      });
    } finally {
      setCognitiveFieldLoading(false);
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

        <div className="flex gap-2">
          <Button onClick={handleRun} disabled={loading || cognitiveFieldLoading}>
            {loading ? 'Running orchestrator...' : 'Trigger Orchestrator'}
          </Button>

          <Button
            onClick={handleGenerateCognitiveField}
            disabled={loading || cognitiveFieldLoading}
            variant="outline"
          >
            {cognitiveFieldLoading ? 'Generating field...' : 'Generate 4-Layer Field'}
          </Button>
        </div>

        {cognitiveFieldResult && (
          <div className="space-y-2 rounded-md border border-blue-500/30 bg-blue-50 p-3 text-sm dark:bg-blue-950/20">
            <div className="flex items-center gap-2">
              <Badge variant={cognitiveFieldResult.success ? 'default' : 'destructive'}>
                {cognitiveFieldResult.success ? 'Field Created' : 'Failed'}
              </Badge>
              <span className="font-medium">
                {cognitiveFieldResult.message || cognitiveFieldResult.error || 'No message'}
              </span>
            </div>

            {cognitiveFieldResult.success && cognitiveFieldResult.field_id && (
              <div className="space-y-1">
                <Label className="text-xs">Cognitive Field ID</Label>
                <div className="break-all rounded bg-white p-2 font-mono text-xs dark:bg-gray-900">
                  {cognitiveFieldResult.field_id}
                </div>
              </div>
            )}

            {cognitiveFieldResult.shards_used !== undefined &&
              cognitiveFieldResult.stardust_used !== undefined && (
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Shards used: {cognitiveFieldResult.shards_used}</span>
                  <span>Stardust used: {cognitiveFieldResult.stardust_used}</span>
                </div>
              )}
          </div>
        )}

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
