'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Brain, Filter, Loader2, MessageSquare, Plus, RefreshCw, Save, Search, Send, Settings, Target } from 'lucide-react';
import { PromptEditor } from './_components/PromptEditor';
import { PromptLibrary } from './_components/PromptLibrary';
import { PromptTestHistory } from './_components/PromptTestHistory';
import { PromptTestResults } from './_components/PromptTestResults';
import { usePromptPlayground } from './usePromptPlayground';
import { PlaygroundPasswordModal, isPlaygroundUnlocked } from './_components/PlaygroundPasswordModal';

export default function PromptPlayground() {
  const playground = usePromptPlayground();
  const [unlocked, setUnlocked] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isPlaygroundUnlocked()) {
      setUnlocked(true);
    } else {
      setShowModal(true);
    }
  }, []);

  const handleUnlock = () => {
    setUnlocked(true);
    setShowModal(false);
  };

  return (
    <>
      {!unlocked ? (
        <PlaygroundPasswordModal open={showModal} onUnlock={handleUnlock} onClose={() => {}} />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-[1600px] mx-auto p-4 lg:p-6">
            {/* Header with enhanced styling */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Prompt Playground
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Test, refine, and rate your content prompts across different personas and platforms.
              </p>
            </div>

            {/* Main Content Layout - Two Panel Design */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Left Panel - Prompt Discovery & Management */}
              <div className="space-y-6">
                {/* Enhanced Prompt Library */}
                <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                  <CardContent className="p-0">
                    {playground.isPromptsLoading ? (
                      <div className="flex items-center justify-center py-12 text-gray-500">
                        <Loader2 className="w-8 h-8 mr-3 animate-spin" />
                        <span className="text-lg">Loading prompts...</span>
                      </div>
                    ) : playground.filteredPrompts.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">No prompts found</h3>
                        <p className="text-gray-400">Try adjusting your filters or create a new prompt</p>
                      </div>
                    ) : (
                      <PromptLibrary
                        groupedPrompts={playground.groupedPrompts}
                        onSelect={playground.handlePromptSelect}
                        onTest={playground.handleLoadPromptContent}
                        selectedPromptId={playground.selectedPrompt?.id || null}
                        onNewPrompt={playground.handleNewPrompt}
                      />
                    )}
                    {playground.error && (
                      <div className="text-red-600 text-sm mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        {playground.error}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              {/* Right Panel - Editor & Testing */}
              <div className="space-y-6">
                {playground.selectedPrompt ? (
                  <>
                    <PromptEditor
                      selectedPrompt={playground.selectedPrompt}
                      instructions={playground.instructions}
                      setInstructions={playground.setInstructions}
                      setSelectedPrompt={playground.setSelectedPrompt}
                      onReset={playground.handleFullReset}
                      onTest={playground.handleTestPrompt}
                      isLoading={playground.isLoading}
                      userMessage={playground.userMessage}
                      setUserMessage={playground.setUserMessage}
                      selectedPersona={playground.selectedPersona}
                      setSelectedPersona={playground.setSelectedPersona}
                    />
                    <PromptTestResults
                      testOutput={playground.testOutput}
                      isLoading={playground.isLoading}
                      currentRating={playground.currentRating}
                      setCurrentRating={playground.setCurrentRating}
                      feedback={playground.feedback}
                      setFeedback={playground.setFeedback}
                      onSaveFeedback={playground.handleSaveFeedback}
                      feedbackLoading={playground.feedbackLoading}
                      feedbackError={playground.feedbackError}
                      feedbackSuccess={playground.feedbackSuccess}
                      disabled={playground.currentRating === 0}
                    />
                  </>
                ) : (
                  <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center py-24">
                      <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
                        <Brain className="w-16 h-16 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                        Select a prompt to get started
                      </h3>
                      <p className="text-gray-600 text-center max-w-md text-lg leading-relaxed">
                        Choose a prompt from the library or create a new one to start testing and refining your content prompts.
                      </p>
                      <Button
                        onClick={playground.handleNewPrompt}
                        className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Prompt
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
