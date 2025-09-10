'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useProjectFingerprintStore } from '@/store/project-fingerprint-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft
} from 'lucide-react'
import { FingerprintDisplay } from '@/app/dashboard/chat/components/notepad/FingerprintDisplay'
// Simple date formatting utility
const formatDistanceToNow = (date: Date, options?: { addSuffix?: boolean }) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMinutes < 1) return options?.addSuffix ? 'just now' : 'now'
  if (diffMinutes < 60) return options?.addSuffix ? `${diffMinutes} minutes ago` : `${diffMinutes}m`
  if (diffHours < 24) return options?.addSuffix ? `${diffHours} hours ago` : `${diffHours}h`
  if (diffDays < 7) return options?.addSuffix ? `${diffDays} days ago` : `${diffDays}d`
  
  return date.toLocaleDateString()
}

interface ProjectViewScreenProps {
  projectId: string
}

export function ProjectViewScreen({ projectId }: ProjectViewScreenProps) {
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch project data
  const project = useQuery(
    api.projectsQueries.getProjectDetails,
    projectId && firebaseUser?.uid ? { 
      projectId: projectId as any, 
      userId: firebaseUser.uid 
    } : 'skip'
  )

  // Initialize fingerprint store
  const { initializeFingerprintData, currentFingerprint, isLoading: fingerprintLoading } = useProjectFingerprintStore()

  useEffect(() => {
    if (firebaseUser?.uid && projectId) {
      initializeFingerprintData(projectId, firebaseUser.uid, {} as any)
    }
  }, [firebaseUser?.uid, projectId, initializeFingerprintData])

  const handleStartChat = () => {
    router.push(`/dashboard/chat?projectId=${projectId}`)
  }

  const handleCreateNote = () => {
    router.push(`/dashboard/notes?projectId=${projectId}`)
  }

  const handleEditFingerprint = () => {
    router.push(`/dashboard/project-discovery?projectId=${projectId}`)
  }

  if (!firebaseUser) {
    return <div>Loading...</div>
  }

  if (!project || !currentFingerprint) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <button 
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse mx-auto" />
              <h2 className="text-xl font-light text-foreground">Loading project</h2>
              <p className="text-muted-foreground/60 text-sm">Preparing your project intelligence...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const lastEvolution = currentFingerprint.last_evolution 
    ? formatDistanceToNow(new Date(currentFingerprint.last_evolution), { addSuffix: true })
    : 'Never'

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => router.push('/dashboard/living-projects')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to projects
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-end">
            <div className="lg:col-span-3">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-light tracking-tight text-foreground leading-tight">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-lg text-muted-foreground/80 leading-relaxed max-w-2xl ml-4">
                    {project.description}
                  </p>
                )}
                <div className="ml-4 flex items-center gap-4 text-sm text-muted-foreground/60">
                  <span>Living project</span>
                  <span>•</span>
                  <span>v{currentFingerprint.intelligence_version || '1.0'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleEditFingerprint}
                variant="outline"
                className="w-full justify-start text-sm"
              >
                Edit intelligence
              </Button>
            </div>
          </div>
        </div>

        {/* Project Stats - Minimal */}
        <div className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div>
              <div className="text-muted-foreground/60 mb-1">Last evolution</div>
              <div className="font-medium text-foreground">{lastEvolution}</div>
            </div>
            <div>
              <div className="text-muted-foreground/60 mb-1">Status</div>
              <div className="font-medium text-foreground capitalize">{currentFingerprint.status || 'Active'}</div>
            </div>
            <div>
              <div className="text-muted-foreground/60 mb-1">Complexity</div>
              <div className="font-medium text-foreground">{currentFingerprint.complexity_level || 1}/10</div>
            </div>
            <div>
              <div className="text-muted-foreground/60 mb-1">Natural rhythm</div>
              <div className="font-medium text-foreground capitalize">{currentFingerprint.natural_rhythm || 'Not set'}</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex items-center gap-8 border-b border-border/30">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'intelligence', label: 'Intelligence' },
              { key: 'timeline', label: 'Timeline' },
              { key: 'actions', label: 'Actions' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`pb-4 px-1 text-sm font-medium transition-colors duration-200 relative ${
                  activeTab === key 
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground/70'
                }`}
              >
                {label}
                {activeTab === key && (
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
                )}
              </button>
            ))}
          </div>

          <TabsContent value="overview" className="space-y-8">
            {/* Core sections */}
            <div className="space-y-8">
              {/* Core Intention */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">Core intention</h3>
                <div className="bg-muted/30 p-4 rounded border-l-2 border-blue-400/60">
                  <p className="text-muted-foreground leading-relaxed">
                    {currentFingerprint.core_intention || 'No core intention defined yet.'}
                  </p>
                </div>
              </div>

              {/* Success Vision */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">Success vision</h3>
                <div className="bg-muted/30 p-4 rounded border-l-2 border-blue-400/60">
                  <p className="text-muted-foreground leading-relaxed">
                    {currentFingerprint.success_vision || 'No success vision defined yet.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Deliverables & Benefits */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">Tangible deliverables</h3>
                {currentFingerprint.tangible_deliverables?.length ? (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {currentFingerprint.tangible_deliverables.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-muted-foreground/40 font-mono text-xs mt-1">{String(index + 1).padStart(2, '0')}</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground/60 text-sm">No deliverables defined yet.</p>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">Intangible benefits</h3>
                {currentFingerprint.intangible_benefits?.length ? (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {currentFingerprint.intangible_benefits.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-muted-foreground/40 font-mono text-xs mt-1">{String(index + 1).padStart(2, '0')}</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground/60 text-sm">No benefits defined yet.</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Intelligence fingerprint</h3>
              <div className="bg-card border border-border/50 p-6">
                <FingerprintDisplay 
                  isOpen={true} 
                  onClose={() => {}} 
                  width={100} 
                  onWidthChange={() => {}} 
                  style={{ width: '100%' }} 
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <div className="space-y-6">
              {currentFingerprint.key_phases?.length ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Key phases</h3>
                  {currentFingerprint.key_phases.map((phase, index) => (
                    <div key={index} className="space-y-3 pb-6 border-b border-border/30 last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">{phase.name}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{phase.essence}</p>
                        </div>
                        <div className="text-xs text-muted-foreground/60 font-mono">
                          Phase {index + 1}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground/80">
                        <span>Duration: {phase.estimated_duration}</span>
                        {phase.readiness_indicators?.length > 0 && (
                          <span>Indicators: {phase.readiness_indicators.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground/60">No phases defined yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Available actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleStartChat}
                  className="w-full text-left p-4 bg-card border border-border/50 hover:border-border transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Start conversation
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Chat with your project's intelligence for insights and guidance
                      </p>
                    </div>
                    <div className="text-muted-foreground/50">
                      →
                    </div>
                  </div>
                </button>

                <button 
                  onClick={handleCreateNote}
                  className="w-full text-left p-4 bg-card border border-border/50 hover:border-border transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Create note
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add materials, research, and notes to your project
                      </p>
                    </div>
                    <div className="text-muted-foreground/50">
                      →
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
