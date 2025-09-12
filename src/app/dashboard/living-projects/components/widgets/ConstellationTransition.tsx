'use client'

import React, { useEffect, useState } from 'react'

interface ConstellationTransitionProps {
  isActive: boolean
  onComplete: () => void
  duration?: number // in milliseconds, default 3000
}

interface AnimatedStar {
  id: string
  x: number
  y: number
  size: number
  delay: number
  color: string
}

export function ConstellationTransition({
  isActive,
  onComplete,
  duration = 3000
}: ConstellationTransitionProps) {
  const [phase, setPhase] = useState<'stars' | 'widgets' | 'complete'>('stars')
  const [animatedStars, setAnimatedStars] = useState<AnimatedStar[]>([])

  // Generate scattered stars for animation
  useEffect(() => {
    if (!isActive) return

    const stars: AnimatedStar[] = []
    const colors = [
      'text-blue-400',
      'text-purple-400',
      'text-pink-400',
      'text-indigo-400',
      'text-cyan-400',
      'text-violet-400'
    ]

    for (let i = 0; i < 24; i++) {
      stars.push({
        id: `star-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 8 + 4,
        delay: Math.random() * 1000,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }

    setAnimatedStars(stars)

    // Phase transitions
    const starPhaseDuration = duration * 0.4
    const widgetPhaseDuration = duration * 0.4

    const starTimer = setTimeout(() => {
      setPhase('widgets')
    }, starPhaseDuration)

    const widgetTimer = setTimeout(() => {
      setPhase('complete')
      onComplete()
    }, starPhaseDuration + widgetPhaseDuration)

    return () => {
      clearTimeout(starTimer)
      clearTimeout(widgetTimer)
    }
  }, [isActive, duration, onComplete])

  if (!isActive) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Scattered points phase */}
        {phase === 'stars' && animatedStars.map((star) => (
          <div
            key={star.id}
            className="absolute"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              animationDelay: `${star.delay}ms`
            }}
          >
            <div
              className={`${star.color} rounded-full opacity-0`}
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                animation: `pointScatter 2s ease-out forwards`,
                animationDelay: `${star.delay}ms`
              }}
            />
          </div>
        ))}

        {/* Widget formation phase - removed background widgets */}
      </div>

      {/* Central message */}
      <div className="relative z-10 text-center space-y-4">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <div className="text-4xl font-light text-blue-400/60 animate-pulse" style={{ animationDuration: '2s' }}>
            •
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-light text-foreground">
            {phase === 'stars' && 'Stars aligning...'}
            {phase === 'widgets' && 'Building your dashboard...'}
            {phase === 'complete' && 'Ready!'}
          </h2>

          <p className="text-muted-foreground/70 max-w-md">
            {phase === 'stars' && 'Your project constellation is complete'}
            {phase === 'widgets' && 'Creating personalized tools for your workflow'}
            {phase === 'complete' && 'Your project dashboard is ready to explore'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="w-32 h-1 bg-muted/30 rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-300"
            style={{
              width: phase === 'stars' ? '33%' : phase === 'widgets' ? '66%' : '100%'
            }}
          />
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes pointScatter {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
          100% {
            opacity: 0.6;
            transform: scale(1) translate(
              ${Math.random() * 100 - 50}px,
              ${Math.random() * 100 - 50}px
            );
          }
        }

      `}</style>
    </div>
  )
}
