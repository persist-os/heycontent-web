'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchWithApiKey, getCurrentUserId } from '@/app/lib/api-helpers';
import { Users, Play, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

type AgentExecutionInfo = {
  agent_id: string;
  role_name: string;
  success: boolean;
  execution_time_seconds: number;
  error?: string;
};

type MultiAgentTestResult = {
  success: boolean;
  output_id?: string;
  artifacts?: any[];
  artifact_ids?: string[];
  artifact_count?: number;
  execution_plan?: {
    total_agents: number;
    core_agents: number;
    specialist_agents: number;
    max_depth: number;
  };
  coordination_result?: {
    agents_executed: number;
    execution_time_seconds: number;
    agent_outputs?: Record<string, any>;
  };
  error?: string;
};

export function MultiAgentTestPanel() {
  const [userId, setUserId] = useState('');
  const [widgetId, setWidgetId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [executionPrompt, setExecutionPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MultiAgentTestResult | null>(null);

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

  const handleRunWidget = async () => {
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

      if (!widgetId || !projectId) {
        setResult({
          success: false,
          error: 'Widget ID and Project ID are required',
        });
        return;
      }

      const response = await fetchWithApiKey('/api/widgets/run', {
        method: 'POST',
        body: JSON.stringify({
          user_id: resolvedUserId,
          widget_id: widgetId,
          project_id: projectId,
          execution_prompt: executionPrompt || undefined,
        }),
      });

      let data: MultiAgentTestResult;
      try {
        data = (await response.json()) as MultiAgentTestResult;
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
            },
      );
    } catch (error: any) {
      setResult({
        success: false,
        error: error?.message || 'Failed to run widget',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-blue-500/30 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle>Multi-Agent Widget Executor</CardTitle>
          </div>
          <CardDescription>
            Test widget families with multi-agent coordination, dependency graphs, and specialist spawning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="multi-agent-user-id">User ID</Label>
              <Input
                id="multi-agent-user-id"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="Auto-detected"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="multi-agent-project-id">Project ID</Label>
              <Input
                id="multi-agent-project-id"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                placeholder="Enter project ID"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="multi-agent-widget-id">Widget ID (Multi-Agent Family)</Label>
            <Input
              id="multi-agent-widget-id"
              value={widgetId}
              onChange={(event) => setWidgetId(event.target.value)}
              placeholder="Enter widget ID with agent roster"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="multi-agent-execution-prompt">Execution Prompt (Optional)</Label>
            <Textarea
              id="multi-agent-execution-prompt"
              value={executionPrompt}
              onChange={(event) => setExecutionPrompt(event.target.value)}
              placeholder="Optional custom prompt for widget execution"
              rows={3}
            />
          </div>

          <Button 
            onClick={handleRunWidget} 
            disabled={loading || !widgetId || !projectId}
            className="w-full gap-2"
          >
            <Play className="h-4 w-4" />
            {loading ? 'Executing Multi-Agent Widget...' : 'Run Multi-Agent Widget'}
          </Button>

          {result && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2 rounded-md border p-3">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <Badge variant={result.success ? 'default' : 'destructive'}>
                  {result.success ? 'Execution Complete' : 'Execution Failed'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {result.error || 'Widget executed successfully'}
                </span>
              </div>

              {/* Execution Plan */}
              {result.execution_plan && (
                <Card className="border-blue-500/30 bg-blue-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Execution Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-muted-foreground">Total Agents:</span>
                        <Badge variant="outline">{result.execution_plan.total_agents}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-green-600" />
                        <span className="text-muted-foreground">Core Agents:</span>
                        <Badge variant="outline">{result.execution_plan.core_agents}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-muted-foreground">Specialists:</span>
                        <Badge variant="outline">{result.execution_plan.specialist_agents}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="text-muted-foreground">Max Depth:</span>
                        <Badge variant="outline">{result.execution_plan.max_depth}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Coordination Result */}
              {result.coordination_result && (
                <Card className="border-purple-500/30 bg-purple-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Coordination Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Agents Executed:</span>
                      <Badge variant="outline">{result.coordination_result.agents_executed}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Execution Time:</span>
                      <Badge variant="outline">
                        {result.coordination_result.execution_time_seconds.toFixed(2)}s
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Output ID */}
              {result.output_id && (
                <div className="space-y-2">
                  <Label className="text-xs">Output ID</Label>
                  <div className="break-all rounded bg-card border p-2 font-mono text-xs">
                    {result.output_id}
                  </div>
                </div>
              )}

              {/* Artifacts */}
              {result.artifacts && result.artifacts.length > 0 && (
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Generated Artifacts ({result.artifact_count})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.artifacts.map((artifact: any, idx: number) => (
                      <div key={idx} className="rounded border bg-card p-3 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">
                            {artifact.artifact_type || artifact.artifactType || 'Unknown Type'}
                          </Badge>
                          {artifact.metadata?.multiAgent && (
                            <Badge variant="outline" className="text-xs">
                              Multi-Agent
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {artifact.metadata?.action === 'update' ? 'Updated' : 'Created'} •{' '}
                          {artifact.metadata?.familyName || 'Unknown Family'}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Agent Outputs (if available) */}
              {result.coordination_result?.agent_outputs && (
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Agent Outputs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs overflow-auto max-h-64 rounded bg-card border p-3">
                      {JSON.stringify(result.coordination_result.agent_outputs, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">How Multi-Agent Testing Works</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-muted-foreground">
          <p>
            <strong>1. Execution Planning:</strong> Analyzes agent roster and generates dependency graph
          </p>
          <p>
            <strong>2. Spawn Evaluation:</strong> Determines which specialist agents should spawn based on conditions
          </p>
          <p>
            <strong>3. Dependency Execution:</strong> Executes agents in topological order, passing outputs between dependent agents
          </p>
          <p>
            <strong>4. Artifact Generation:</strong> Aggregates multi-agent outputs into final artifacts
          </p>
          <p className="pt-2 border-t">
            <strong>Note:</strong> Widget must have an <code>agentRoster</code> with 2+ agents to trigger multi-agent mode. Single-agent widgets use the legacy execution path.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

