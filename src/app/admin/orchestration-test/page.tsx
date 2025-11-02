'use client';

/**
 * Orchestration Testing Dashboard
 * 
 * Admin-only interface for testing Phase 2.5 orchestration fixes:
 * - Assignment orchestration with dependencies
 * - Artifact locking and collaboration
 * - Widget question storage in Convex
 * - Redis-based status tracking
 * - Multi-widget artifact updates
 * 
 * Access: Admin and Super Admin roles only
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAdminAuth } from '@/app/lib/admin-auth';
import { useAuth } from '@/app/context/auth-context';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap } from 'lucide-react';
import { DashboardNav } from '@/app/dashboard/_components/dashboard-nav';
import { TestConfiguration } from './components/TestConfiguration';
import { TestResultsList } from './components/TestResultsList';
import { AssignmentStatusView } from './components/AssignmentStatusView';
import { TestLogsView } from './components/TestLogsView';
import { ArtifactTestingView } from './components/ArtifactTestingView';
import { useOrchestrationTests } from './hooks/useOrchestrationTests';

export default function OrchestrationTestPage() {
  const router = useRouter();
  const { isAdmin, isSuperAdmin } = useAdminAuth();
  const { firebaseUser } = useAuth();

  // Test state
  const [activeTab, setActiveTab] = useState('orchestration');
  const [testProjectId, setTestProjectId] = useState('');
  const [testProjectName, setTestProjectName] = useState('Test Assignment ' + Date.now());
  const [statusPolling, setStatusPolling] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Query existing projects
  const existingProjects = useQuery(
    api.projectsQueries.getByUser,
    currentUserId ? { userId: currentUserId } : 'skip'
  );

  // ✅ Reactive assignment status - NO POLLING! Convex auto-updates
  const assignmentStatusLive = useQuery(
    api.backgroundJobs.getAssignmentStatus,
    currentUserId && testProjectId ? { projectId: testProjectId, userId: currentUserId } : 'skip'
  );

  // Initialize user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await getCurrentUserId();
        setCurrentUserId(id);
      } catch (error) {
        console.error('Failed to get user ID:', error);
      }
    };
    fetchUserId();
  }, []);

  // Orchestration tests hook
  const {
    testResults,
    setTestResults,
    isRunningTests,
    setIsRunningTests,
    assignmentStatus,
    setAssignmentStatus,
    logs,
    setLogs,
    addLog,
    runTest1_CreateAssignment,
    runTest1_5_GenerateWidgets,
    runTest2_StartOrchestration,
    runTest3_CheckStatus,
    runTest4_CheckQuestions,
    runTest6_CheckArtifacts,
    answerWidgetQuestion
  } = useOrchestrationTests(currentUserId);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin && !isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, isSuperAdmin, router]);

  // ✅ Sync live status to local state for compatibility with existing UI
  useEffect(() => {
    if (assignmentStatusLive && statusPolling) {
      setAssignmentStatus(assignmentStatusLive as any);
    }
  }, [assignmentStatusLive, statusPolling, setAssignmentStatus]);

  // Initialize test results when component mounts
  useEffect(() => {
    if (testResults.length === 0) {
      setTestResults([
        { test: 'test1', status: 'pending' },
        { test: 'test1_5', status: 'pending' },
        { test: 'test2', status: 'pending' },
        { test: 'test3', status: 'pending' },
        { test: 'test4', status: 'pending' },
        { test: 'test6', status: 'pending' },
      ]);
    }
  }, [testResults.length, setTestResults]);

  // Run all tests sequentially (FULL FLOW)
  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([
      { test: 'test1', status: 'pending' },
      { test: 'test1_5', status: 'pending' },
      { test: 'test2', status: 'pending' },
      { test: 'test3', status: 'pending' },
      { test: 'test4', status: 'pending' },
      { test: 'test6', status: 'pending' },
    ]);
    setLogs([]);
    addLog('=== STARTING FULL ORCHESTRATION TEST SUITE ===');

    let projectId = testProjectId;

    // Phase 1: Create Assignment & Fingerprint (if not using existing)
    if (!projectId) {
      addLog('\n--- PHASE 1: Assignment Creation ---');
      const newProjectId = await runTest1_CreateAssignment(testProjectName);
      if (!newProjectId) {
        setIsRunningTests(false);
        return;
      }
      projectId = newProjectId;
      setTestProjectId(newProjectId);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Phase 2: Generate Widgets
      addLog('\n--- PHASE 2: Widget Generation ---');
      const widgetsGenerated = await runTest1_5_GenerateWidgets(projectId);
      if (!widgetsGenerated) {
        setIsRunningTests(false);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      addLog('\n--- Using existing project: ' + projectId + ' ---');
    }
    
    // Phase 3: Start Orchestration
    addLog('\n--- PHASE 3: Orchestration ---');
    await runTest2_StartOrchestration(projectId);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Phase 4: Status Tracking
    addLog('\n--- PHASE 4: Status Tracking ---');
    await runTest3_CheckStatus(projectId);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Phase 5: Question Handling
    addLog('\n--- PHASE 5: Widget Questions ---');
    await runTest4_CheckQuestions(projectId);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Phase 6: Artifact Collaboration
    addLog('\n--- PHASE 6: Artifact Collaboration ---');
    await runTest6_CheckArtifacts(projectId, firebaseUser?.uid);

    setIsRunningTests(false);
    addLog('\n=== TEST SUITE COMPLETE ===');
    setStatusPolling(true); // Auto-start polling after test completion
  };

  // Run individual test
  const runIndividualTest = async (testId: string) => {
    switch (testId) {
      case 'test1':
        const newProjectId = await runTest1_CreateAssignment(testProjectName);
        if (newProjectId) setTestProjectId(newProjectId);
        break;
      case 'test1_5':
        await runTest1_5_GenerateWidgets(testProjectId);
        break;
      case 'test2':
        await runTest2_StartOrchestration(testProjectId);
        break;
      case 'test3':
        await runTest3_CheckStatus(testProjectId);
        break;
      case 'test4':
        await runTest4_CheckQuestions(testProjectId);
        break;
      case 'test6':
        await runTest6_CheckArtifacts(testProjectId, firebaseUser?.uid);
        break;
    }
  };

  // Reset test state
  const handleReset = () => {
    setTestProjectId('');
    setTestProjectName('Test Assignment ' + Date.now());
    setTestResults([
      { test: 'test1', status: 'pending' },
      { test: 'test1_5', status: 'pending' },
      { test: 'test2', status: 'pending' },
      { test: 'test3', status: 'pending' },
      { test: 'test4', status: 'pending' },
      { test: 'test6', status: 'pending' },
    ]);
    setAssignmentStatus(null);
    setStatusPolling(false);
    setLogs([]);
  };

  if (!isAdmin && !isSuperAdmin) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 overflow-y-auto overflow-x-hidden ml-16 md:ml-20">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Zap className="h-8 w-8 text-blue-600" />
                Orchestration Test Lab
              </h1>
              <p className="text-muted-foreground mt-1">
                Phase 2.5 - Test widget orchestration, dependencies, and artifact collaboration
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </Badge>
          </div>

          {/* Test Configuration */}
          <TestConfiguration
            testProjectId={testProjectId}
            setTestProjectId={setTestProjectId}
            testProjectName={testProjectName}
            setTestProjectName={setTestProjectName}
            currentUserId={currentUserId}
            isRunningTests={isRunningTests}
            statusPolling={statusPolling}
            setStatusPolling={setStatusPolling}
            onRunAllTests={runAllTests}
            onReset={handleReset}
            existingProjects={existingProjects || []}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="orchestration">Orchestration</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            {/* Orchestration Tab */}
            <TabsContent value="orchestration" className="space-y-4">
              <TestResultsList
                testResults={testResults}
                testProjectId={testProjectId}
                onRunTest={runIndividualTest}
              />
            </TabsContent>

            {/* Status Tab */}
            <TabsContent value="status" className="space-y-4">
              <AssignmentStatusView
                assignmentStatus={assignmentStatus}
                onAnswerQuestion={answerWidgetQuestion}
              />
            </TabsContent>

            {/* Artifacts Tab */}
            <TabsContent value="artifacts" className="space-y-4">
              <ArtifactTestingView
                testProjectId={testProjectId}
                currentUserId={currentUserId}
                onRunArtifactTest={() => runTest6_CheckArtifacts(testProjectId, firebaseUser?.uid)}
              />
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="space-y-4">
              <TestLogsView logs={logs} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
