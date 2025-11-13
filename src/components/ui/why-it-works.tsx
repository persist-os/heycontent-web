'use client'

import React from 'react'
import { T } from '@/components/translation'

export function WhyItWorks() {
  return (
    <section className="py-12 sm:py-20 lg:py-32 bg-gradient-to-br from-primary/[0.08] via-accent/[0.06] to-primary/[0.08] dark:from-background dark:via-accent/[0.03] dark:to-background relative overflow-hidden min-h-screen flex items-center">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10 w-full">
        <div className="space-y-8 sm:space-y-12 lg:space-y-16">
          <div className="text-center space-y-3 sm:space-y-4 lg:space-y-6">
            <h2 className="text-xl sm:text-3xl lg:text-5xl font-light text-foreground leading-tight hover:text-foreground/90 transition-colors duration-300 cursor-default">
              <T context="section.features.title">Three Killer Features</T>
            </h2>
          </div>

          <div className="space-y-8 sm:space-y-12 lg:space-y-16">
            {/* Feature 1 */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-lg sm:text-xl lg:text-3xl font-medium text-foreground">
                <T context="section.features.feature1.title">Multiplayer AI</T>
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-3xl">
                <T context="section.features.feature1.description">Add anyone to your assignment. Everyone sees agents building. Sarah adds a requirement mid-build. Tom adjusts priorities. The agents edit the artifacts in real-time. It's multiplayer AI.</T>
              </p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-lg sm:text-xl lg:text-3xl font-medium text-foreground">
                <T context="section.features.feature2.title">Agents That Think Together</T>
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-3xl">
                <T context="section.features.feature2.description">Not parallel processing. Actual coordination. The budget agent tells the timeline agent about constraints. The email agent asks the strategy agent about messaging. They build something coherent.</T>
              </p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-lg sm:text-xl lg:text-3xl font-medium text-foreground">
                <T context="section.features.feature3.title">Versions That Tell a Story</T>
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-3xl">
                  <strong className="text-foreground">v1:</strong> <T context="section.features.feature3.v1">AI creates marketing plan</T>
                </p>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-3xl">
                  <strong className="text-foreground">v2:</strong> <T context="section.features.feature3.v2">You adjust the budget</T>
                </p>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-3xl">
                  <strong className="text-foreground">v3:</strong> <T context="section.features.feature3.v3">AI updates timeline based on budget</T>
                </p>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-3xl">
                  <strong className="text-foreground">v4:</strong> <T context="section.features.feature3.v4">Team member adds ideas</T>
                </p>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-3xl italic mt-4">
                  <T context="section.features.feature3.conclusion">Every edit tracked. AI learns from changes.</T>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
