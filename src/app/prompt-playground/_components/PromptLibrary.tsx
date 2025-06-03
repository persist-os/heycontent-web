import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';
import { PromptCard } from '@/components/ui/prompt-card';

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

interface PromptLibraryProps {
  filteredPrompts: Prompt[];
  onSelect: (id: string) => void;
  onTest: (id: string) => void;
  selectedPromptId: string | null;
  onNewPrompt: () => void;
}

export function PromptLibrary({
  filteredPrompts,
  onSelect,
  onTest,
  selectedPromptId,
  onNewPrompt
}: PromptLibraryProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Prompt Library</CardTitle>
          <Button variant="outline" size="sm" onClick={onNewPrompt}>
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
        <CardDescription>
          {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''} found
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {filteredPrompts.map(prompt => (
          <PromptCard
            key={prompt.id}
            id={prompt.id}
            title={prompt.title}
            description={prompt.description}
            persona={prompt.persona}
            platform={prompt.platform}
            goal={prompt.goal}
            content={prompt.content}
            rating={prompt.rating}
            onSelect={onSelect}
            onTest={onTest}
            isSelected={selectedPromptId === prompt.id}
          />
        ))}
        {filteredPrompts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No prompts found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 