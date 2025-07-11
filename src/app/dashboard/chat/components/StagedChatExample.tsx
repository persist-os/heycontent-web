import React, { useState } from 'react';
import { sendChatMessage } from '../utils/api-utils';
import type { ChatResponseData } from '../utils/api-utils';

interface ChatStage {
  stage: string;
  message: string;
  completed: boolean;
  error?: boolean;
  timestamp?: number;
}

interface IntentAnalysisResult {
  needs_context: boolean;
  confidence_score: number;
  reasoning: string;
  method?: string;
}

export default function StagedChatExample() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStages, setChatStages] = useState<ChatStage[]>([]);
  const [response, setResponse] = useState<ChatResponseData | null>(null);
  const [intentAnalysis, setIntentAnalysis] = useState<IntentAnalysisResult | null>(null);
  const [vectorSearchSkipped, setVectorSearchSkipped] = useState(false);

  const resetStages = () => {
    setChatStages([]);
    setResponse(null);
    setIntentAnalysis(null);
    setVectorSearchSkipped(false);
  };

  const updateStage = (stage: string, message: string, completed: boolean = false, error: boolean = false) => {
    setChatStages(prev => {
      const existing = prev.find(s => s.stage === stage);
      if (existing) {
        return prev.map(s => 
          s.stage === stage 
            ? { ...s, message, completed, error, timestamp: Date.now() }
            : s
        );
      } else {
        return [...prev, { stage, message, completed, error, timestamp: Date.now() }];
      }
    });
  };

  const handleSubmit = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    resetStages();

    try {
      const result = await sendChatMessage(
        query,
        true, // isFirstMessage
        null, // sessionId
        null, // contentContext
        false, // hasContextInjection
        (status: string) => {
          console.log('Status update:', status);
          
          // Extract intent analysis information from status updates
          if (status.includes('Query needs context') || status.includes('Query is self-contained')) {
            const isHeuristic = status.includes('heuristic');
            const needsContext = status.includes('needs context');
            
            setIntentAnalysis({
              needs_context: needsContext,
              confidence_score: isHeuristic ? 0.8 : 0.9,
              reasoning: status,
              method: isHeuristic ? 'heuristic' : 'backend'
            });
          }
          
          // Map status updates to UI stages with the new three-stage flow
          if (status.includes('Analyzing whether your query needs context')) {
            updateStage('analyzing', '🧐 Analyzing whether your query needs context...');
          } else if (status.includes('Query needs context - proceeding with vector search')) {
            updateStage('analyzing', '✅ Query needs context - proceeding with search', true);
            updateStage('search', '🔍 Looking through all your content...');
          } else if (status.includes('Query needs context (heuristic) - proceeding with vector search')) {
            updateStage('analyzing', '✅ Query needs context (heuristic) - proceeding with search', true);
            updateStage('search', '🔍 Looking through all your content...');
          } else if (status.includes('Query is self-contained - skipping vector search')) {
            updateStage('analyzing', '⚡ Query is self-contained - skipping search', true);
            updateStage('generating', '✨ Generating your response...');
            setVectorSearchSkipped(true);
          } else if (status.includes('Query is self-contained (heuristic) - skipping vector search')) {
            updateStage('analyzing', '⚡ Query is self-contained (heuristic) - skipping search', true);
            updateStage('generating', '✨ Generating your response...');
            setVectorSearchSkipped(true);
          } else if (status.includes('Skipping content search')) {
            updateStage('analyzing', '⚡ Analysis complete - skipping search', true);
            updateStage('generating', '✨ Generating your response...');
            setVectorSearchSkipped(true);
          } else if (status.includes('Looking through all your content')) {
            updateStage('search', '🔍 Looking through all your content...');
          } else if (status.includes('Discovered') && status.includes('potentially relevant items')) {
            updateStage('search', '🔍 Content search completed', true);
            updateStage('grading', '🧠 Analyzing relevance across your content...');
          } else if (status.includes('Analyzing relevance across your content')) {
            updateStage('grading', '🧠 Analyzing relevance across your content...');
          } else if (status.includes('Found') && status.includes('highly relevant items')) {
            updateStage('grading', status, true);
            updateStage('generating', '✨ Generating your response...');
          } else if (status.includes('Using all available context')) {
            updateStage('grading', '⚠️ Using all available context', true, true);
            updateStage('generating', '✨ Generating your response...');
          } else if (status.includes('Generating your response')) {
            updateStage('generating', '✨ Generating your response...');
          }
        },
        true // useContextSearch
      );

      updateStage('generating', '✅ Response ready!', true);
      setResponse(result);
    } catch (error) {
      console.error('Chat error:', error);
      updateStage('error', `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, true, true);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick test queries
  const testQueries = [
    { query: 'hi', expected: 'Should skip vector search' },
    { query: 'What is machine learning?', expected: 'Should skip vector search' },
    { query: 'Analyze my recent content', expected: 'Should use vector search' },
    { query: 'How can I improve my posts?', expected: 'Should use vector search' }
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Three-Stage Chat System Test</h2>
        <p className="text-sm text-gray-600 mb-4">
          This demonstrates the three-stage approach: intent analysis → conditional vector search → response generation.
        </p>

        {/* Quick Test Buttons */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2">Quick Tests:</h3>
          <div className="flex flex-wrap gap-2">
            {testQueries.map((test, index) => (
              <button
                key={index}
                onClick={() => setQuery(test.query)}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
                disabled={isLoading}
                title={test.expected}
              >
                "{test.query}"
              </button>
            ))}
          </div>
        </div>

        {/* Query Input */}
        <div className="mb-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask me anything..."
            className="w-full p-3 border rounded-lg resize-none h-20"
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !query.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Send Message (Three-Stage)'}
        </button>
      </div>

      {/* Intent Analysis Results */}
      {intentAnalysis && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Intent Analysis Result:</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Needs Context:</strong> {intentAnalysis.needs_context ? 'Yes' : 'No'}</div>
            <div><strong>Confidence:</strong> {(intentAnalysis.confidence_score * 100).toFixed(1)}%</div>
            <div><strong>Method:</strong> {intentAnalysis.method || 'unknown'}</div>
            <div><strong>Reasoning:</strong> {intentAnalysis.reasoning}</div>
            <div><strong>Vector Search:</strong> {vectorSearchSkipped ? 'Skipped ⚡' : 'Performed 🔍'}</div>
          </div>
        </div>
      )}

      {/* Progress Stages */}
      {chatStages.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-700">Processing Stages:</h3>
          {chatStages.map((stage, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${
                  stage.error 
                    ? 'bg-red-500' 
                    : stage.completed 
                      ? 'bg-green-500' 
                      : 'bg-blue-500 animate-pulse'
                }`} />
                <span className={`${
                  stage.error 
                    ? 'text-red-700' 
                    : stage.completed 
                      ? 'text-green-700' 
                      : 'text-blue-700'
                }`}>
                  {stage.message}
                </span>
              </div>
              {stage.timestamp && (
                <span className="text-xs text-gray-500">
                  {new Date(stage.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-700 mb-3">Response:</h3>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{response.chat_response}</p>
          </div>
          
          {/* Debug Information */}
          <div className="mt-4 pt-4 border-t text-xs text-gray-500">
            <h4 className="font-medium mb-2">Debug Information:</h4>
            <div className="space-y-1">
              <div>Session ID: {response.session_id}</div>
              <div>Vector Search Used: {response.vector_search_metadata?.foundRelevantContent ? 'Yes' : 'No'}</div>
              {response.vector_search_metadata?.skipped_reason && (
                <div>Skip Reason: {response.vector_search_metadata.skipped_reason}</div>
              )}
              {response.vector_search_metadata?.relevantItemsCount && (
                <div>Relevant Items: {response.vector_search_metadata.relevantItemsCount}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 