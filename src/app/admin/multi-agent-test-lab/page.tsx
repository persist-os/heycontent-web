'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScenarioSelector } from './components/ScenarioSelector';
import { ExecutionVisualizer } from './components/ExecutionVisualizer';
import { DependencyGraphView } from './components/DependencyGraphView';
import { AgentTraceViewer } from './components/AgentTraceViewer';
import { ArtifactRenderer } from '@/components/artifacts/ArtifactRenderer';
import { FileText } from 'lucide-react';
import { fetchWithApiKey, getCurrentUserId } from '@/app/lib/api-helpers';
import { 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Network,
  Users,
  Zap
} from 'lucide-react';

type TestScenario = {
  id: string;
  name: string;
  description: string;
  agentCount: number;
  hasConditionalSpawns: boolean;
  maxDepth: number;
  testsFocus: string[];
};

type TestExecutionResult = {
  success: boolean;
  scenario_id: string;
  project_id: string;
  widget_id: string;
  execution_plan?: {
    total_agents: number;
    core_agents: number;
    specialist_agents: number;
    max_depth: number;
    steps: any[];
  };
  coordination_result?: {
    agents_executed: number;
    execution_time_seconds: number;
    agent_outputs: Record<string, any>;
    final_output: any;
  };
  artifacts?: any[];
  dependency_graph?: any;
  execution_trace?: any[];
  error?: string;
};

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'simple-sequential',
    name: 'Simple Sequential (2 Agents)',
    description: 'Basic 2-agent flow: Researcher → Synthesizer',
    agentCount: 2,
    hasConditionalSpawns: false,
    maxDepth: 2,
    testsFocus: ['Basic dependency execution', 'Output passing', 'Artifact generation'],
  },
  {
    id: 'conditional-specialist',
    name: 'Conditional Specialist (3 Agents)',
    description: 'Core agent with conditional specialist: Researcher → [Fact Checker if conflicts] → Synthesizer',
    agentCount: 3,
    hasConditionalSpawns: true,
    maxDepth: 3,
    testsFocus: ['Spawn condition evaluation', 'Conditional execution', 'Dynamic spawning'],
  },
  {
    id: 'complex-pipeline',
    name: 'Complex Pipeline (4+ Agents)',
    description: 'Multi-stage pipeline with specialists at each stage',
    agentCount: 4,
    hasConditionalSpawns: true,
    maxDepth: 4,
    testsFocus: ['Deep dependencies', 'Multi-stage processing', 'Complex coordination'],
  },
  {
    id: 'parallel-specialists',
    name: 'Parallel Specialists (5 Agents)',
    description: 'Core agent with multiple parallel specialists merging to synthesizer',
    agentCount: 5,
    hasConditionalSpawns: true,
    maxDepth: 3,
    testsFocus: ['Parallel execution', 'Multiple dependencies', 'Output merging'],
  },
];

export default function MultiAgentTestLabPage() {
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TestExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState('scenario');

  const handleRunScenario = async (scenario: TestScenario) => {
    setRunning(true);
    setResult(null);
    setSelectedScenario(scenario);

    try {
      const userId = await getCurrentUserId();

      // Call test orchestrator endpoint
      const response = await fetchWithApiKey('/api/admin/multi-agent/run-test-scenario', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          scenario_id: scenario.id,
          auto_create_project: true,
          auto_create_widget: true,
          capture_trace: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setActiveTab('execution');
      } else {
        setResult({
          success: false,
          scenario_id: scenario.id,
          project_id: '',
          widget_id: '',
          error: data.error || 'Test execution failed',
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        scenario_id: scenario.id,
        project_id: '',
        widget_id: '',
        error: error?.message || 'Failed to run test scenario',
      });
    } finally {
      setRunning(false);
    }
  };

  const handleRerunLastTest = async () => {
    if (!selectedScenario) return;
    await handleRunScenario(selectedScenario);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Network className="h-8 w-8 text-blue-600" />
              Multi-Agent Test Laboratory
            </h1>
            <p className="text-muted-foreground">
              Comprehensive testing environment for multi-agent coordination, dependency graphs, and execution flows
            </p>
          </div>
          {result && (
            <div className="flex gap-2">
              <Button
                onClick={handleRerunLastTest}
                disabled={running}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
                Rerun Test
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {result && (
        <Card className={`border-2 ${result.success ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5'}`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <div className="font-semibold">
                    {result.success ? 'Test Execution Successful' : 'Test Execution Failed'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Scenario: {selectedScenario?.name || result.scenario_id}
                  </div>
                </div>
              </div>
              {result.coordination_result && (
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-lg">{result.coordination_result.agents_executed}</div>
                    <div className="text-muted-foreground">Agents Executed</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">
                      {result.coordination_result.execution_time_seconds.toFixed(2)}s
                    </div>
                    <div className="text-muted-foreground">Execution Time</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{result.artifacts?.length || 0}</div>
                    <div className="text-muted-foreground">Artifacts</div>
                  </div>
                </div>
              )}
            </div>
            {result.error && (
              <div className="mt-3 p-3 rounded bg-red-500/10 border border-red-500/30 text-sm">
                <strong>Error:</strong> {result.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="scenario" className="gap-2">
            <Zap className="h-4 w-4" />
            Test Scenarios
          </TabsTrigger>
          <TabsTrigger value="execution" className="gap-2" disabled={!result}>
            <Play className="h-4 w-4" />
            Execution View
          </TabsTrigger>
          <TabsTrigger value="dependency" className="gap-2" disabled={!result}>
            <Network className="h-4 w-4" />
            Dependency Graph
          </TabsTrigger>
          <TabsTrigger value="trace" className="gap-2" disabled={!result}>
            <Users className="h-4 w-4" />
            Agent Trace
          </TabsTrigger>
          <TabsTrigger value="artifacts" className="gap-2" disabled={!result || !result.artifacts || result.artifacts.length === 0}>
            <FileText className="h-4 w-4" />
            Artifacts ({result?.artifacts?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scenario" className="space-y-4">
          <ScenarioSelector
            scenarios={TEST_SCENARIOS}
            onRunScenario={handleRunScenario}
            running={running}
          />
        </TabsContent>

        <TabsContent value="execution" className="space-y-4">
          {result && (
            <ExecutionVisualizer
              result={result}
              scenario={selectedScenario}
            />
          )}
        </TabsContent>

        <TabsContent value="dependency" className="space-y-4">
          {result && (
            <DependencyGraphView
              executionPlan={result.execution_plan}
              coordinationResult={result.coordination_result}
            />
          )}
        </TabsContent>

        <TabsContent value="trace" className="space-y-4">
          {result && (
            <AgentTraceViewer
              executionTrace={result.execution_trace}
              agentOutputs={result.coordination_result?.agent_outputs}
            />
          )}
        </TabsContent>

        <TabsContent value="artifacts" className="space-y-4">
          {result && result.artifacts && result.artifacts.length > 0 ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generated Artifacts</CardTitle>
                  <CardDescription>
                    Real artifacts created in Convex by the multi-agent system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-4">
                      <span>Project ID: <code className="text-xs bg-muted px-2 py-1 rounded">{result.project_id}</code></span>
                      <span>Widget ID: <code className="text-xs bg-muted px-2 py-1 rounded">{result.widget_id}</code></span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {result.artifacts.map((artifact, index) => (
                <div key={artifact._id || index}>
                  <ArtifactRenderer artifact={artifact} editable={false} />
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No artifacts created yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Run a test scenario to see artifacts generated by the multi-agent system
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

