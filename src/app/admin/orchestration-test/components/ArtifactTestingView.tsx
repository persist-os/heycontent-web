'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Lock, Users, CheckCircle, RefreshCw } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';

interface ArtifactTestingViewProps {
  testProjectId: string;
  currentUserId: string | null;
  onRunArtifactTest: () => void;
}

export function ArtifactTestingView({ testProjectId, currentUserId, onRunArtifactTest }: ArtifactTestingViewProps) {
  // ✅ Auto-query artifacts for the current project
  const artifacts = useQuery(
    api.widgetOutputsQueries.getWidgetOutputData,
    testProjectId && currentUserId
      ? {
          userId: currentUserId,
          filters: { projectId: testProjectId as Id<"projects"> },
        }
      : 'skip'
  );

  // Filter to only show items with artifact data
  const artifactOutputs = Array.isArray(artifacts) 
    ? artifacts.filter(output => output.artifactType && output.artifactData)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Artifact Testing</span>
          {testProjectId && (
            <Badge variant="outline" className="text-xs">
              {artifactOutputs.length} artifact{artifactOutputs.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Test artifact locking and multi-widget collaboration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={onRunArtifactTest} 
            disabled={!testProjectId} 
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Artifacts Test
          </Button>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">What to look for:</h4>
            <ul className="space-y-1 text-sm">
              <li className="flex items-start gap-2">
                <Lock className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>Artifacts should have multiple contributors (collaboration)</span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Version numbers incrementing with each update</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-purple-500 flex-shrink-0" />
                <span>No race conditions or lost updates</span>
              </li>
            </ul>
          </div>

          {/* Artifacts Display */}
          {!testProjectId ? (
            <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
              Select a project to view artifacts
            </div>
          ) : artifactOutputs.length === 0 ? (
            <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
              No artifacts found for this project
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Project Artifacts:</h4>
              {artifactOutputs.map((artifact) => (
                <Card key={artifact._id} className="border-l-4 border-l-blue-500 bg-card">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{artifact.artifactType}</span>
                            {artifact.userApproved && (
                              <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Output ID: {artifact.outputId}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          v{artifact.version || 1}
                        </Badge>
                      </div>

                      {/* Collaboration Info */}
                      {artifact.contributors && artifact.contributors.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <Users className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">
                            {artifact.contributors.length} contributor{artifact.contributors.length !== 1 ? 's' : ''}
                          </span>
                          {artifact.lastContributor && (
                            <span className="text-muted-foreground">
                              · Last: {artifact.lastContributor.substring(0, 8)}...
                            </span>
                          )}
                        </div>
                      )}

                      {/* Artifact Data Preview */}
                      {artifact.artifactData && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                            View artifact data
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto text-xs border">
                            {JSON.stringify(artifact.artifactData, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

