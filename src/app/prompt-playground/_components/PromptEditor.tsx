import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RefreshCw, Send, Brain, Filter, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { personas } from '@/data/personas';

interface Prompt {
  id: string;
  title: string;
  description: string;
  instructions: string;
  platform: string;
  goal: string;
  rating?: number;
}

interface PromptEditorProps {
  selectedPrompt: Prompt;
  instructions: string;
  setInstructions: (v: string) => void;
  setSelectedPrompt: (fn: (prev: Prompt | null) => Prompt | null) => void;
  onReset: () => void;
  onTest: () => void;
  onProposeEdit?: () => void;
  isLoading: boolean;
  userMessage: string;
  setUserMessage: (v: string) => void;
  selectedPersona: string;
  setSelectedPersona: (v: string) => void;
}

export function PromptEditor({
  selectedPrompt,
  instructions,
  setInstructions,
  setSelectedPrompt,
  onReset,
  onTest,
  onProposeEdit,
  isLoading,
  userMessage,
  setUserMessage,
  selectedPersona,
  setSelectedPersona
}: PromptEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Prompt Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Persona Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Persona</label>
          <Select
            value={selectedPersona || 'all'}
            onValueChange={v => setSelectedPersona(v === 'all' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select persona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Personas</SelectItem>
              {personas.map(persona => (
                <SelectItem key={persona.id} value={persona.name}>
                  {persona.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPersona && (
            <div className="mt-2">
              <p className="text-xs text-gray-600">
                {personas.find(p => p.name === selectedPersona)?.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {personas.find(p => p.name === selectedPersona)?.tone.map(tone => (
                  <Badge key={tone} variant="outline" className="text-xs">
                    {tone}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Title */}
        <div>
          <h3 className="text-base font-semibold mb-1">Prompt Title</h3>
          <Input
            value={selectedPrompt.title}
            onChange={e => setSelectedPrompt(prev => prev ? { ...prev, title: e.target.value } : null)}
            placeholder="Enter prompt title..."
            className="mb-4"
          />
        </div>
        {/* Description Section */}
        <div>
          <h3 className="text-base font-semibold mb-1">Prompt Description</h3>
          <p className="text-xs text-gray-500 mb-2">
            <b>Description</b> is a high-level summary of your prompt's purpose and the AI's role. It should explain what the agent is supposed to do, who it's for, and what the overall goal is. <br />
            <span className="italic">Example: "You are an advanced Gmail assistant. Your job is to analyze a user's Gmail inbox, summarize the most important and urgent emails, identify newsletters and routine messages, and suggest actions or responses."</span>
          </p>
          <Textarea
            value={selectedPrompt.description}
            onChange={e => setSelectedPrompt(prev => prev ? { ...prev, description: e.target.value } : null)}
            placeholder="Summarize the agent's purpose and main goal..."
            className="min-h-40"
          />
        </div>
        {/* Instructions Section */}
        <div>
          <h3 className="text-base font-semibold mb-1">Prompt Instructions</h3>
          <p className="text-xs text-gray-500 mb-2">
            <b>Instructions</b> are the detailed, step-by-step guidance for the AI. Include specific requirements, constraints, output format, and any examples or edge cases. <br />
            <span className="italic">Example: "Analyze the following list of emails from a user's Gmail inbox. For each email, extract the subject, sender, snippet, and date. Categorize emails into: Urgent emails, Newsletters, Other emails..."</span>
          </p>
          <Textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="Write detailed instructions for the AI here..."
            className="min-h-32"
          />
        </div>
        {/* User Message Section */}
        <div>
          <h3 className="text-base font-semibold mb-1">User Message</h3>
          <p className="text-xs text-gray-500 mb-2">
            <b>User Message</b> is the input the user would send to the AI. This field is blank until you type something.
          </p>
          <Textarea
            value={userMessage}
            onChange={e => setUserMessage(e.target.value)}
            placeholder="Type your message to the AI here..."
            className="min-h-24"
          />
        </div>
        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={onReset} disabled={isLoading}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          <div className="flex gap-2">
            {onProposeEdit && (
              <Button 
                variant="outline" 
                onClick={onProposeEdit} 
                disabled={isLoading}
                className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300"
              >
                <Edit className="w-4 h-4 mr-1" />
                Propose Edit
              </Button>
            )}
            <Button onClick={onTest} disabled={isLoading}>
              <Send className="w-4 h-4 mr-1" />
              {isLoading ? 'Testing...' : 'Test Prompt'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 