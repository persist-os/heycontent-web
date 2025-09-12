'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  onCreateProject: () => void
}

export function EmptyState({ onCreateProject }: EmptyStateProps) {
  return (
    <div className="py-20 px-4">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto">
        {/* Main Content - Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          {/* Left Side - Content */}
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-foreground leading-tight">
                  Your first project
                  <br />
                  <span className="text-muted-foreground">is waiting</span>
                </h2>
                <div className="w-24 h-px bg-border mt-6" />
              </div>
              
              <div className="space-y-4 text-muted-foreground/80 leading-relaxed">
                <p>
                  Each project becomes a thinking partner that learns your style, 
                  understands your goals, and evolves alongside your work.
                </p>
                <p>
                  Start with just a name and description. Through conversation, 
                  your project develops its own intelligence.
                </p>
              </div>
              
              <div className="pt-4">
                <Button
                  onClick={onCreateProject}
                  className="bg-foreground text-background hover:bg-foreground/90 transition-colors duration-300 px-6 py-3"
                  size="lg"
                >
                  Start your first project
                </Button>
              </div>
            </div>
          </div>
          
          {/* Right Side - Visual Element */}
          <div className="lg:col-span-2 relative">
            <div className="relative">
              {/* Subtle visual elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-500/5 rounded-lg" />
              <div className="relative p-8 lg:p-12">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="h-2 bg-muted/50 rounded w-3/4" />
                    <div className="h-2 bg-muted/30 rounded w-1/2" />
                    <div className="h-2 bg-muted/20 rounded w-2/3" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-1 bg-blue-400/20 rounded w-1/3" />
                    <div className="text-xs text-muted-foreground/50 font-mono">discovering</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features - Minimal List */}
        <div className="mt-20">
          <div className="max-w-2xl">
            <h3 className="text-xl font-light text-foreground mb-8">How it works</h3>
            <div className="space-y-6">
              <div className="flex gap-6">
                <div className="text-sm text-muted-foreground/50 font-mono w-8">01</div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-2">Discovery conversation</h4>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">
                    Start with a name and description. Through natural conversation, 
                    your project learns your goals, style, and preferences.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="text-sm text-muted-foreground/50 font-mono w-8">02</div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-2">Intelligence development</h4>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">
                    Your project creates its unique fingerprint—a living understanding 
                    of what you're trying to achieve and how you work.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="text-sm text-muted-foreground/50 font-mono w-8">03</div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-2">Continuous evolution</h4>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">
                    As you work, your project evolves its understanding, 
                    adapting to new insights and changing directions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
