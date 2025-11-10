'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Users, GitBranch, Layers, Target } from 'lucide-react';

type TestScenario = {
  id: string;
  name: string;
  description: string;
  agentCount: number;
  hasConditionalSpawns: boolean;
  maxDepth: number;
  testsFocus: string[];
};

type ScenarioSelectorProps = {
  scenarios: TestScenario[];
  onRunScenario: (scenario: TestScenario) => void;
  running: boolean;
};

export function ScenarioSelector({ scenarios, onRunScenario, running }: ScenarioSelectorProps) {
  return (
    <div className="space-y-4">
      <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-background">
        <CardHeader>
          <CardTitle>Automated Test Scenarios</CardTitle>
          <CardDescription>
            Select a pre-configured test scenario. Each scenario automatically creates a test project and widget,
            executes the multi-agent flow, and provides detailed execution analysis.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((scenario) => (
          <Card
            key={scenario.id}
            className="border-muted hover:border-primary/50 transition-colors"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{scenario.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {scenario.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="ml-2">
                  {scenario.agentCount} Agents
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scenario Metrics */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-muted-foreground">Agents:</span>
                  <Badge variant="outline" className="ml-auto">
                    {scenario.agentCount}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-600" />
                  <span className="text-muted-foreground">Depth:</span>
                  <Badge variant="outline" className="ml-auto">
                    {scenario.maxDepth}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <GitBranch className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">Conditional:</span>
                  <Badge 
                    variant={scenario.hasConditionalSpawns ? 'default' : 'outline'}
                    className="ml-auto"
                  >
                    {scenario.hasConditionalSpawns ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>

              {/* Tests Focus */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-4 w-4 text-orange-600" />
                  <span>Tests Focus:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {scenario.testsFocus.map((focus) => (
                    <Badge key={focus} variant="outline" className="text-xs">
                      {focus}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Run Button */}
              <Button
                onClick={() => onRunScenario(scenario)}
                disabled={running}
                className="w-full gap-2"
              >
                <Play className="h-4 w-4" />
                {running ? 'Running...' : 'Run Test Scenario'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="border-muted bg-muted/30">
        <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Automated Flow:</strong> Each test scenario automatically:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Creates a test project with unique ID</li>
            <li>Generates a widget family with the specified agent roster</li>
            <li>Executes the multi-agent coordination flow</li>
            <li>Captures execution traces, dependency graphs, and agent outputs</li>
            <li>Generates artifacts and validates multi-agent metadata</li>
          </ul>
          <p className="pt-2 border-t">
            <strong>No manual setup required</strong> - just click "Run Test Scenario" and view the results.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

