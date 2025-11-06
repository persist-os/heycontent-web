'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, CheckCircle2, Clock } from 'lucide-react';

type DependencyGraphViewProps = {
  executionPlan: any;
  coordinationResult: any;
};

export function DependencyGraphView({ executionPlan, coordinationResult }: DependencyGraphViewProps) {
  if (!executionPlan || !executionPlan.steps) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No execution plan available
        </CardContent>
      </Card>
    );
  }

  // Get agent outputs for execution status
  const agentOutputs = coordinationResult?.agent_outputs || {};

  // Sort steps by execution order
  const sortedSteps = [...executionPlan.steps].sort(
    (a, b) => a.execution_order - b.execution_order
  );

  return (
    <div className="space-y-4">
      <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-background">
        <CardHeader>
          <CardTitle>Dependency Graph Visualization</CardTitle>
          <CardDescription>
            Visual representation of agent execution order and dependencies
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center space-y-4">
            {sortedSteps.map((step: any, idx: number) => {
              const outputKey = `${step.agent_id}_output`;
              const wasExecuted = outputKey in agentOutputs;
              const executionTime = wasExecuted 
                ? agentOutputs[outputKey]?.execution_time_seconds 
                : null;

              return (
                <div key={step.agent_id} className="w-full max-w-2xl">
                  {/* Agent Node */}
                  <div
                    className={`
                      relative p-4 rounded-lg border-2 transition-all
                      ${wasExecuted 
                        ? 'border-green-500 bg-green-500/10' 
                        : step.should_spawn
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-400 bg-gray-400/10'
                      }
                    `}
                  >
                    {/* Execution Order Badge */}
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
                      {step.execution_order + 1}
                    </div>

                    {/* Status Badge */}
                    <div className="absolute -top-3 -right-3">
                      {wasExecuted ? (
                        <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      ) : step.should_spawn ? (
                        <div className="w-8 h-8 rounded-full bg-yellow-600 text-white flex items-center justify-center shadow-lg text-xs font-bold">
                          ⏳
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center shadow-lg text-xs font-bold">
                          ⏸
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Agent Info */}
                      <div>
                        <div className="text-lg font-bold">{step.role_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Agent ID: {step.agent_id}
                        </div>
                      </div>

                      {/* Spawn Condition */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Spawn Condition:</span>
                        <Badge variant={step.should_spawn ? 'default' : 'outline'} className="text-xs">
                          {step.spawn_condition}
                        </Badge>
                      </div>

                      {/* Dependencies */}
                      {step.dependencies && step.dependencies.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Dependencies:</span>
                          <div className="flex flex-wrap gap-2">
                            {step.dependencies.map((dep: string) => (
                              <Badge key={dep} variant="outline" className="text-xs">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Execution Time */}
                      {typeof executionTime === 'number' && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Execution time: {executionTime.toFixed(2)}s
                        </div>
                      )}

                      {/* Responsibilities */}
                      {step.responsibilities && step.responsibilities.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium">Responsibilities:</span>
                          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                            {step.responsibilities.map((resp: string, i: number) => (
                              <li key={i}>{resp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow to next agent */}
                  {idx < sortedSteps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-600"></div>
            <span>Executed successfully</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-600"></div>
            <span>Pending execution (should spawn)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-400"></div>
            <span>Skipped (conditional spawn not met)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <span>Execution order in dependency graph</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

