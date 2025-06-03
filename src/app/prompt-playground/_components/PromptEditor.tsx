import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RefreshCw, Send, Brain } from 'lucide-react';

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  persona: string;
  platform: string;
  goal: string;
  rating?: number;
}

interface PromptEditorProps {
  selectedPrompt: Prompt;
  editedContent: string;
  setEditedContent: (v: string) => void;
  setSelectedPrompt: (fn: (prev: Prompt | null) => Prompt | null) => void;
  onReset: () => void;
  onTest: () => void;
  isLoading: boolean;
}

export function PromptEditor({
  selectedPrompt,
  editedContent,
  setEditedContent,
  setSelectedPrompt,
  onReset,
  onTest,
  isLoading
}: PromptEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Prompt Editor
        </CardTitle>
        <CardDescription>
          Edit and customize your prompt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              value={selectedPrompt.title}
              onChange={(e) => setSelectedPrompt(prev => prev ? { ...prev, title: e.target.value } : null)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Input
              value={selectedPrompt.description}
              onChange={(e) => setSelectedPrompt(prev => prev ? { ...prev, description: e.target.value } : null)}
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Prompt Content</label>
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="Write your prompt here..."
            className="min-h-32"
          />
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onReset} disabled={isLoading}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          <Button onClick={onTest} disabled={isLoading}>
            <Send className="w-4 h-4 mr-1" />
            {isLoading ? 'Testing...' : 'Test Prompt'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 