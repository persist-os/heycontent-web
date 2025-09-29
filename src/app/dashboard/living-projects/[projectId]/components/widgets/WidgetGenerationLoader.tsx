/**
 * WIDGET GENERATION LOADER COMPONENT
 * 
 * Loading animation component for widget generation process
 * with animated constellation and progress steps.
 */

'use client'

import React from 'react'

/**
 * Widget generation loading animation component
 * Shows animated constellation and progress steps during AI widget generation
 */
export function WidgetGenerationLoader() {
  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Animated Constellation */}
        <div className="relative w-64 h-64 mx-auto">
          {/* Central pulsing core */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
          </div>
          
          {/* Orbiting particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-spin"
              style={{
                top: '50%',
                left: '50%',
                transformOrigin: `${120 + i * 20}px 0px`,
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateX(${120 + i * 20}px)`,
                animation: `orbit ${3 + i * 0.5}s linear infinite`
              }}
            />
          ))}
          
          {/* Floating widgets */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-lg opacity-70 animate-bounce"
              style={{
                top: `${20 + i * 20}%`,
                left: `${10 + i * 25}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${2 + i * 0.3}s`
              }}
            />
          ))}
        </div>
        
        {/* Loading Text */}
        <div className="space-y-4">
          <h2 className="text-3xl font-light text-foreground">
            Generating Your Project Constellation
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI is analyzing your project fingerprint and creating personalized widgets 
            tailored to your unique working style and project characteristics.
          </p>
          
          {/* Progress Steps */}
          <div className="flex justify-center space-x-8 mt-8">
            {[
              { step: 1, text: 'Analyzing Fingerprint', status: 'active' },
              { step: 2, text: 'Generating Categories', status: 'pending' },
              { step: 3, text: 'Creating Widgets', status: 'pending' },
              { step: 4, text: 'Optimizing Layout', status: 'pending' }
            ].map(({ step, text, status }) => (
              <div key={step} className="flex flex-col items-center space-y-2">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${status === 'active' 
                    ? 'bg-blue-500 text-white animate-pulse' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {step}
                </div>
                <span className="text-xs text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes orbit {
          from { transform: translate(-50%, -50%) rotate(0deg) translateX(120px) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg) translateX(120px) rotate(-360deg); }
        }
      `}</style>
    </div>
  )
}
