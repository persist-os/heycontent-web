'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArtifactRenderer } from '@/components/artifacts/ArtifactRenderer'
import { FileText, Lock, Users, CheckCircle, RefreshCw } from 'lucide-react';

interface ArtifactTestingViewProps {
  testProjectId: string;
  currentUserId: string | null;
  onRunArtifactTest: () => void;
}

export function ArtifactTestingView({ testProjectId, currentUserId, onRunArtifactTest }: ArtifactTestingViewProps) {
  // ✅ Auto-query artifacts for the current project
  const artifacts = useQuery(
    api.artifactQueries.getProjectArtifacts,
    testProjectId && currentUserId
      ? {
          projectId: testProjectId as Id<"projects">,
          userId: currentUserId
        }
      : 'skip'
  );

  // Artifacts are already in the correct format
  const artifactOutputs = Array.isArray(artifacts) ? artifacts : [];

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
                            <span className="font-medium">{artifact.type}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Artifact ID: {artifact._id}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          v{artifact.metadata?.version || 1}
                        </Badge>
                      </div>

                      {/* Collaboration Info */}
                      {artifact.metadata?.lastUpdatedBy && (
                        <div className="flex items-center gap-2 text-xs">
                          <Users className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">
                            Last updated by: {artifact.metadata.lastUpdatedBy.substring(0, 8)}...
                          </span>
                        </div>
                      )}

                      {/* Artifact Renderer */}
                      <div className="mt-3">
                        <ArtifactRenderer 
                          artifact={artifact} 
                          editable={false}
                        />
                      </div>
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

