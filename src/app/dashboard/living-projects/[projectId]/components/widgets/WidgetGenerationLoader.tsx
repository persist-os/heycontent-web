/**
 * WIDGET GENERATION LOADER COMPONENT
 * 
 * Elegant loading state for widget generation
 * Clean, calm, anti-corporate design
 */

'use client'

import React from 'react'

export function WidgetGenerationLoader() {
  return (
    <div className="h-screen flex items-center justify-center overflow-hidden">
      <div className="max-w-xl w-full px-8 space-y-8">
        
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-4xl font-light tracking-tight text-foreground">
            Generating
          </h1>
          <p className="text-lg text-muted-foreground font-light">
            Your project constellation
          </p>
        </div>

        {/* Subtle animation */}
        <div className="relative h-1 bg-muted/30 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-blue-400/30 rounded-full"
            style={{
              width: '40%',
              animation: 'shimmer 2.5s ease-in-out infinite'
            }}
          />
        </div>

      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0%, 100% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(250%);
          }
        }
      `}</style>
    </div>
  )
}
