'use client';

import { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { fetchWithApiKey } from '@/app/lib/api-helpers';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'running' | 'pending';
  message?: string;
  duration?: number;
}

interface WidgetStatus {
  widget_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface AssignmentStatus {
  assignment_id: string;
  overall_status: string;
  widgets: WidgetStatus[];
  artifacts: any[];
  needs_user_input?: {
    count: number;
    questions: any[];
  };
}

export function useOrchestrationTests(currentUserId: string | null) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [assignmentStatus, setAssignmentStatus] = useState<AssignmentStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const createProject = useMutation(api.projectsMutations.createProject);
  const createFingerprint = useMutation(api.projectFingerprintMutations.create);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 100));
  }, []);

  const updateTestStatus = useCallback((
    testId: string, 
    status: 'pass' | 'fail' | 'running' | 'pending',
    message?: string
  ) => {
    setTestResults(prev => 
      prev.map(t => t.test === testId ? { ...t, status, message } : t)
    );
  }, []);

  // Test 1: Create Assignment (Project)
  const runTest1_CreateAssignment = useCallback(async (testProjectName: string) => {
    if (!currentUserId) {
      updateTestStatus('test1', 'fail', 'No user ID available');
      addLog('ERROR: No user ID. Cannot create project.');
      return null;
    }

    updateTestStatus('test1', 'running');
    addLog(`Creating test assignment: "${testProjectName}"...`);
    
    try {
      const newProjectId = await createProject({
        userId: currentUserId,
        name: testProjectName,
        description: 'Test project for orchestration testing with multiple widgets and dependencies'
      });

      addLog(`✓ Created project: ${newProjectId}`);
      
      // Auto-create fingerprint
      await createFingerprint({
        projectId: newProjectId,
        userId: currentUserId,
        name: testProjectName,
        description: 'Test project for orchestration testing'
      });
      
      addLog(`✓ Created fingerprint for project`);
      updateTestStatus('test1', 'pass', `Created: ${newProjectId}`);
      return newProjectId;
    } catch (error: any) {
      updateTestStatus('test1', 'fail', error.message);
      addLog(`ERROR: ${error.message}`);
      return null;
    }
  }, [currentUserId, createProject, createFingerprint, updateTestStatus, addLog]);

  // Test 1.5: Generate Widgets
  const runTest1_5_GenerateWidgets = useCallback(async (testProjectId: string) => {
    if (!testProjectId || !currentUserId) {
      updateTestStatus('test1_5', 'fail', 'No project ID or user ID');
      return false;
    }

    updateTestStatus('test1_5', 'running');
    addLog('Generating widgets for project...');
    
    try {
      const response = await fetchWithApiKey(`/api/projects/${testProjectId}/generate-widgets`, {
        method: 'POST',
        body: JSON.stringify({
          project_id: testProjectId,
          user_preferences: {}
        })
      });

      if (!response.ok) {
        throw new Error(`Widget generation failed: ${response.status}`);
      }

      const data = await response.json();
      addLog(`✓ Generated ${data.widgets_count || 0} widgets`);
      updateTestStatus('test1_5', 'pass', `Generated ${data.widgets_count || 0} widgets`);
      return true;
    } catch (error: any) {
      updateTestStatus('test1_5', 'fail', error.message);
      addLog(`ERROR: ${error.message}`);
      return false;
    }
  }, [currentUserId, updateTestStatus, addLog]);

  // Test 2: Start Orchestration
  const runTest2_StartOrchestration = useCallback(async (testProjectId: string) => {
    if (!testProjectId) {
      updateTestStatus('test2', 'fail', 'No project ID provided');
      return false;
    }

    updateTestStatus('test2', 'running');
    addLog(`Starting orchestration for project ${testProjectId}...`);
    
    try {
      const response = await fetchWithApiKey(`/api/projects/${testProjectId}/start`, {
        method: 'POST',
        body: JSON.stringify({
          assignment_goal: 'Test orchestration with widget dependencies'
        })
      });

      if (!response.ok) {
        throw new Error(`Start failed: ${response.status}`);
      }

      const result = await response.json();
      const data = result.data || result; // Handle both wrapped and unwrapped responses
      addLog(`✓ Started! Queued ${data.queued_count} widgets`);
      updateTestStatus('test2', 'pass', `Queued ${data.queued_count} widgets`);
      return true;
    } catch (error: any) {
      updateTestStatus('test2', 'fail', error.message);
      addLog(`ERROR: ${error.message}`);
      return false;
    }
  }, [updateTestStatus, addLog]);

  // Test 3: Check Status
  const runTest3_CheckStatus = useCallback(async (testProjectId: string) => {
    if (!testProjectId) {
      updateTestStatus('test3', 'fail', 'No project ID provided');
      return false;
    }

    updateTestStatus('test3', 'running');
    addLog('Checking assignment status...');
    
    try {
      const response = await fetchWithApiKey(`/api/projects/${testProjectId}/status`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const result = await response.json();
      const data = result.data || result; // Handle both wrapped and unwrapped responses
      setAssignmentStatus(data);
      addLog(`✓ Status: ${data.overall_status}, ${data.widgets?.length || 0} widgets`);
      updateTestStatus('test3', 'pass', `Status: ${data.overall_status}`);
      return true;
    } catch (error: any) {
      updateTestStatus('test3', 'fail', error.message);
      addLog(`ERROR: ${error.message}`);
      return false;
    }
  }, [updateTestStatus, addLog]);

  // Test 4: Check Questions
  const runTest4_CheckQuestions = useCallback(async (testProjectId: string) => {
    if (!testProjectId) {
      updateTestStatus('test4', 'fail', 'No project ID provided');
      return false;
    }

    updateTestStatus('test4', 'running');
    addLog('Checking for widget questions...');
    
    try {
      const response = await fetchWithApiKey(`/api/widgetQuestions/pending/${testProjectId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Question check failed: ${response.status}`);
      }

      const data = await response.json();
      const questions = data.data?.questions || [];
      addLog(`✓ Found ${questions.length} pending questions`);
      updateTestStatus('test4', 'pass', `${questions.length} pending questions`);
      return true;
    } catch (error: any) {
      updateTestStatus('test4', 'fail', error.message);
      addLog(`ERROR: ${error.message}`);
      return false;
    }
  }, [updateTestStatus, addLog]);

  // Test 6: Check Artifacts
  const runTest6_CheckArtifacts = useCallback(async (testProjectId: string, firebaseUserId?: string) => {
    if (!testProjectId) {
      updateTestStatus('test6', 'fail', 'No project ID provided');
      return false;
    }

    updateTestStatus('test6', 'running');
    addLog('Checking artifacts for collaboration...');
    
    try {
      const response = await fetchWithApiKey(`/api/widgetOutputs/query`, {
        method: 'POST',
        body: JSON.stringify({
          userId: firebaseUserId,
          useIndex: 'by_project',
          indexFields: { projectId: testProjectId }
        })
      });

      if (!response.ok) {
        throw new Error(`Artifact query failed: ${response.status}`);
      }

      const data = await response.json();
      const artifacts = data.data || [];
      
      const collaborative = artifacts.filter((a: any) => 
        a.contributors && a.contributors.length > 1
      );
      
      addLog(`✓ Found ${artifacts.length} artifacts, ${collaborative.length} collaborative`);
      updateTestStatus('test6', 'pass', `${artifacts.length} artifacts (${collaborative.length} collaborative)`);
      return true;
    } catch (error: any) {
      updateTestStatus('test6', 'fail', error.message);
      addLog(`ERROR: ${error.message}`);
      return false;
    }
  }, [updateTestStatus, addLog]);

  // Answer widget question
  const answerWidgetQuestion = useCallback(async (questionId: string, answer: string) => {
    addLog(`Answering question ${questionId}...`);
    
    try {
      const response = await fetchWithApiKey(`/api/widgetQuestions/answer`, {
        method: 'POST',
        body: JSON.stringify({
          questionId,
          answer
        })
      });

      if (!response.ok) {
        throw new Error(`Answer failed: ${response.status}`);
      }

      addLog('✓ Answer submitted successfully');
      return true;
    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
      return false;
    }
  }, [addLog]);

  return {
    testResults,
    setTestResults,
    isRunningTests,
    setIsRunningTests,
    assignmentStatus,
    setAssignmentStatus,
    logs,
    setLogs,
    addLog,
    updateTestStatus,
    runTest1_CreateAssignment,
    runTest1_5_GenerateWidgets,
    runTest2_StartOrchestration,
    runTest3_CheckStatus,
    runTest4_CheckQuestions,
    runTest6_CheckArtifacts,
    answerWidgetQuestion
  };
}

