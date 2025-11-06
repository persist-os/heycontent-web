'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';

type AgentTraceViewerProps = {
  executionTrace?: any[];
  agentOutputs?: Record<string, any>;
};

export function AgentTraceViewer({ executionTrace, agentOutputs }: AgentTraceViewerProps) {
  if (!agentOutputs || Object.keys(agentOutputs).length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No agent execution trace available
        </CardContent>
      </Card>
    );
  }

  // Convert agent outputs to array and sort by execution order (if available)
  const agentExecutions = Object.entries(agentOutputs).map(([key, output]) => ({
    key,
    agent_id: output.agent_id || key.replace('_output', ''),
    role_name: output.role_name || 'Unknown',
    output_data: output.output_data || output,
    execution_time_seconds: output.execution_time_seconds || 0,
    success: output.success !== false,
    error: output.error,
  }));

  return (
    <div className="space-y-4">
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-background">
        <CardHeader>
          <CardTitle>Agent Execution Trace</CardTitle>
          <CardDescription>
            Detailed execution trace for each agent in the multi-agent coordination flow
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Timeline View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Execution Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agentExecutions.map((execution, idx) => (
              <div key={execution.key}>
                <div className="flex items-start gap-4">
                  {/* Timeline Marker */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                        ${execution.success 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                        }
                      `}
                    >
                      {idx + 1}
                    </div>
                    {idx < agentExecutions.length - 1 && (
                      <div className="w-0.5 h-full min-h-20 bg-border mt-2"></div>
                    )}
                  </div>

                  {/* Execution Details */}
                  <div className="flex-1 pb-6">
                    <Card className={`
                      ${execution.success 
                        ? 'border-green-500/30 bg-green-500/5' 
                        : 'border-red-500/30 bg-red-500/5'
                      }
                    `}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {execution.role_name}
                              {execution.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </CardTitle>
                            <div className="text-xs text-muted-foreground mt-1">
                              Agent ID: {execution.agent_id}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {execution.execution_time_seconds.toFixed(2)}s
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Error Message */}
                        {execution.error && (
                          <div className="p-2 rounded bg-red-500/20 border border-red-500/30 text-sm">
                            <strong>Error:</strong> {execution.error}
                          </div>
                        )}

                        {/* Output Data */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Output:</div>
                          <Tabs defaultValue="formatted" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="formatted">Formatted</TabsTrigger>
                              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                            </TabsList>
                            <TabsContent value="formatted" className="space-y-2">
                              {typeof execution.output_data === 'object' && execution.output_data !== null ? (
                                <div className="space-y-1 text-sm">
                                  {Object.entries(execution.output_data).map(([key, value]) => (
                                    <div key={key} className="flex gap-2">
                                      <span className="text-muted-foreground font-mono text-xs">
                                        {key}:
                                      </span>
                                      <span className="text-xs">
                                        {typeof value === 'object' 
                                          ? JSON.stringify(value, null, 2)
                                          : String(value)
                                        }
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm">{String(execution.output_data)}</div>
                              )}
                            </TabsContent>
                            <TabsContent value="raw">
                              <pre className="text-xs bg-card border rounded p-3 overflow-auto max-h-64">
                                {JSON.stringify(execution.output_data, null, 2)}
                              </pre>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-sm">Execution Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Agents Executed:</span>
            <Badge variant="outline">{agentExecutions.length}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Successful:</span>
            <Badge variant="outline" className="text-green-600">
              {agentExecutions.filter(e => e.success).length}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Failed:</span>
            <Badge variant="outline" className="text-red-600">
              {agentExecutions.filter(e => !e.success).length}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Execution Time:</span>
            <Badge variant="outline">
              {agentExecutions.reduce((sum, e) => sum + e.execution_time_seconds, 0).toFixed(2)}s
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Average Time per Agent:</span>
            <Badge variant="outline">
              {(agentExecutions.reduce((sum, e) => sum + e.execution_time_seconds, 0) / agentExecutions.length).toFixed(2)}s
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

