'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArtifactRenderer } from '@/components/artifacts/ArtifactRenderer';

type ExecutionVisualizerProps = {
  result: any;
  scenario: any;
};

export function ExecutionVisualizer({ result, scenario }: ExecutionVisualizerProps) {
  const { execution_plan, coordination_result, artifacts } = result;

  return (
    <div className="space-y-4">
      {/* Execution Plan Overview */}
      {execution_plan && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-lg">Execution Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Total Agents
                </div>
                <div className="text-2xl font-bold">{execution_plan.total_agents}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  Core Agents
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {execution_plan.core_agents}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Specialists
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {execution_plan.specialist_agents}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  Max Depth
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {execution_plan.max_depth}
                </div>
              </div>
            </div>

            {/* Execution Steps */}
            {execution_plan.steps && execution_plan.steps.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Execution Steps:</div>
                <div className="space-y-2">
                  {execution_plan.steps.map((step: any, idx: number) => (
                    <div
                      key={step.agent_id}
                      className="flex items-center gap-3 p-3 rounded border bg-card"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 font-semibold text-sm">
                        {step.execution_order + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="font-medium">{step.role_name}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {step.agent_id}
                          </Badge>
                          <Badge variant={step.should_spawn ? 'default' : 'outline'} className="text-xs">
                            {step.spawn_condition}
                          </Badge>
                          {step.dependencies && step.dependencies.length > 0 && (
                            <span className="text-xs">
                              Depends on: {step.dependencies.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      {step.should_spawn ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Coordination Results */}
      {coordination_result && (
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardHeader>
            <CardTitle className="text-lg">Coordination Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Agents Executed
                </div>
                <div className="text-2xl font-bold">{coordination_result.agents_executed}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Execution Time
                </div>
                <div className="text-2xl font-bold">
                  {coordination_result.execution_time_seconds.toFixed(2)}s
                </div>
              </div>
            </div>

            {/* Final Output Preview */}
            {coordination_result.final_output && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Final Output:</div>
                <pre className="text-xs bg-card border rounded p-3 overflow-auto max-h-64">
                  {JSON.stringify(coordination_result.final_output, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generated Artifacts */}
      {artifacts && artifacts.length > 0 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Box className="h-5 w-5" />
              Generated Artifacts ({artifacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {artifacts.map((artifact: any, idx: number) => (
              <div key={idx} className="p-3 rounded border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">
                    {artifact.type || artifact.artifact_type || artifact.artifactType || 'Unknown'}
                  </Badge>
                  <div className="flex gap-2">
                    {artifact.metadata?.multiAgent && (
                      <Badge variant="outline" className="text-xs">
                        Multi-Agent
                      </Badge>
                    )}
                    <Badge variant={artifact.metadata?.action === 'update' ? 'default' : 'outline'} className="text-xs">
                      {artifact.metadata?.action || 'create'}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  Family: {artifact.metadata?.familyName || 'Unknown'} •{' '}
                  Widget: {artifact.metadata?.widgetTitle || 'Unknown'}
                </div>
                {/* Render artifact using ArtifactRenderer */}
                <div className="mt-3">
                  <ArtifactRenderer artifact={artifact} editable={false} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Test Context */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-lg">Test Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">Scenario:</span>
              <Badge variant="outline" className="ml-2">
                {scenario?.name || result.scenario_id}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Project ID:</span>
              <code className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                {result.project_id}
              </code>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Widget ID:</span>
              <code className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                {result.widget_id}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

