'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import { PromptCard } from '@/components/ui/prompt-card'
import { 
  Search, 
  Filter, 
  Send, 
  Loader2, 
  RefreshCw, 
  Save, 
  Plus,
  Brain,
  Target,
  MessageSquare
} from 'lucide-react'
import { personas, PersonaProfile } from '@/data/personas'
import { PromptFilters } from './_components/PromptFilters'
import { PromptLibrary } from './_components/PromptLibrary'
import { PromptEditor } from './_components/PromptEditor'
import { PromptTestResults } from './_components/PromptTestResults'
import { PromptTestHistory } from './_components/PromptTestHistory'
import { sendPlaygroundMessage } from './utils/api'

// Types
interface Platform {
  id: string
  name: string
  goals: string[]
}

interface Prompt {
  id: string
  title: string
  description: string
  content: string
  persona: string
  platform: string
  goal: string
  rating?: number
  lastTested?: string
}

interface TestResult {
  id: string
  promptId: string
  output: string
  rating: number
  feedback: string
  timestamp: string
}

// Mock data
const platforms: Platform[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    goals: ['grow audience', 'increase views', 'improve engagement', 'monetize']
  },
  {
    id: 'instagram',
    name: 'Instagram',
    goals: ['boost followers', 'increase stories views', 'drive sales', 'brand awareness']
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    goals: ['go viral', 'increase followers', 'trending content', 'brand partnerships']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    goals: ['professional growth', 'thought leadership', 'networking', 'lead generation']
  }
]

const mockPrompts: Prompt[] = [
  {
    id: '1',
    title: 'Personal Story Post',
    description: 'Share a personal story that connects with your audience',
    content: 'Write a YouTube community post that shares a personal story about how you got into your niche, and ends with a question for your followers.',
    persona: 'The Storyteller',
    platform: 'YouTube',
    goal: 'grow audience',
    rating: 4.2
  },
  {
    id: '2',
    title: 'Educational Hook',
    description: 'Start with a compelling educational hook',
    content: 'Create an Instagram post that starts with "Here\'s what nobody tells you about..." and then provides 3 actionable tips in your expertise area.',
    persona: 'The Educator',
    platform: 'Instagram',
    goal: 'boost followers',
    rating: 4.8
  }
]

export default function PromptPlayground() {
  // State management
  const [selectedPersona, setSelectedPersona] = useState<string>('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('')
  const [selectedGoal, setSelectedGoal] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [testOutput, setTestOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [currentRating, setCurrentRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [prompts, setPrompts] = useState<Prompt[]>(mockPrompts)
  const [error, setError] = useState<string | null>(null)

  // Auto-load persona characteristics
  useEffect(() => {
    if (selectedPersona && selectedPrompt) {
      const persona = personas.find(p => p.name === selectedPersona)
      if (persona) {
        // Auto-populate tone and goals from persona
        console.log('Auto-loaded persona characteristics:', persona.tone, persona.goals)
      }
    }
  }, [selectedPersona, selectedPrompt])

  // Filter prompts based on selections and search
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = searchQuery === '' || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesPersona = !selectedPersona || prompt.persona === selectedPersona
    const matchesPlatform = !selectedPlatform || prompt.platform === selectedPlatform
    const matchesGoal = !selectedGoal || prompt.goal === selectedGoal

    return matchesSearch && matchesPersona && matchesPlatform && matchesGoal
  })

  // Available goals based on selected platform
  const availableGoals = selectedPlatform 
    ? platforms.find(p => p.name === selectedPlatform)?.goals || []
    : []

  const handlePromptSelect = (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId)
    if (prompt) {
      setSelectedPrompt(prompt)
      setEditedContent(prompt.content)
      setSelectedPersona(prompt.persona)
      setSelectedPlatform(prompt.platform)
      setSelectedGoal(prompt.goal)
      setTestOutput('')
      setCurrentRating(0)
      setFeedback('')
      setError(null)
    }
  }

  const handleTestPrompt = async () => {
    if (!selectedPrompt) return
    setIsLoading(true)
    setError(null)
    setTestOutput('')
    try {
      const { output, error } = await sendPlaygroundMessage({
        description: selectedPrompt.description,
        instructions: editedContent,
        message: 'Test this prompt for ' + selectedPrompt.platform
      })
      if (error) {
        setError(error)
        setTestOutput('')
      } else {
        setTestOutput(output || '')
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error')
      setTestOutput('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveFeedback = () => {
    if (!selectedPrompt || currentRating === 0) return

    const newTestResult: TestResult = {
      id: Date.now().toString(),
      promptId: selectedPrompt.id,
      output: testOutput,
      rating: currentRating,
      feedback,
      timestamp: new Date().toISOString()
    }

    setTestResults(prev => [...prev, newTestResult])
    
    // Update prompt rating (simple average for demo)
    const promptTests = testResults.filter(r => r.promptId === selectedPrompt.id)
    const avgRating = (promptTests.reduce((acc, r) => acc + r.rating, 0) + currentRating) / (promptTests.length + 1)
    
    setPrompts(prev => prev.map(p => 
      p.id === selectedPrompt.id ? { ...p, rating: Math.round(avgRating * 10) / 10 } : p
    ))

    // Reset feedback form
    setCurrentRating(0)
    setFeedback('')
  }

  const handleNewPrompt = () => {
    const newPrompt: Prompt = {
      id: Date.now().toString(),
      title: 'New Prompt',
      description: 'Custom prompt',
      content: 'Write your prompt here...',
      persona: selectedPersona || 'The Storyteller',
      platform: selectedPlatform || 'YouTube',
      goal: selectedGoal || 'grow audience'
    }
    
    setPrompts(prev => [...prev, newPrompt])
    handlePromptSelect(newPrompt.id)
  }

  const handleResetEditor = () => {
    if (selectedPrompt) setEditedContent(selectedPrompt.content)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Prompt Playground</h1>
          <p className="text-gray-600">Test, refine, and rate your content prompts across different personas and platforms.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Filters & Prompt Library */}
          <div className="lg:col-span-1 space-y-6">
            <PromptFilters
              personas={personas}
              platforms={platforms}
              selectedPersona={selectedPersona}
              setSelectedPersona={setSelectedPersona}
              selectedPlatform={selectedPlatform}
              setSelectedPlatform={setSelectedPlatform}
              selectedGoal={selectedGoal}
              setSelectedGoal={setSelectedGoal}
              availableGoals={availableGoals}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
            <PromptLibrary
              filteredPrompts={filteredPrompts}
              onSelect={handlePromptSelect}
              onTest={handlePromptSelect}
              selectedPromptId={selectedPrompt?.id || null}
              onNewPrompt={handleNewPrompt}
            />
          </div>

          {/* Right Panel - Editor & Testing */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPrompt ? (
              <>
                <PromptEditor
                  selectedPrompt={selectedPrompt}
                  editedContent={editedContent}
                  setEditedContent={setEditedContent}
                  setSelectedPrompt={setSelectedPrompt}
                  onReset={handleResetEditor}
                  onTest={handleTestPrompt}
                  isLoading={isLoading}
                />
                <PromptTestResults
                  testOutput={testOutput}
                  isLoading={isLoading}
                  currentRating={currentRating}
                  setCurrentRating={setCurrentRating}
                  feedback={feedback}
                  setFeedback={setFeedback}
                  onSaveFeedback={handleSaveFeedback}
                  disabled={currentRating === 0}
                />
                <PromptTestHistory
                  testResults={testResults}
                  selectedPromptId={selectedPrompt.id}
                />
                {error && (
                  <div className="text-red-600 text-sm mt-2">{error}</div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Brain className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a prompt to get started
                  </h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Choose a prompt from the library or create a new one to start testing and refining your content prompts.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
