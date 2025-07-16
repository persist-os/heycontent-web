'use client'

import React from 'react'
import Image from 'next/image'
import Tilt from 'react-parallax-tilt'

interface PlatformCardProps {
  title: string
  description: string
  icon: React.ComponentType<any> | string
  iconProps?: Record<string, any>
  color: string
  insights: string[]
  isSelected?: boolean
  onClick?: () => void
}

const CARD_HEIGHT = 400
const CARD_WIDTH = 'w-full'

export function PlatformCard({
  title,
  description,
  icon,
  iconProps,
  color,
  insights,
  isSelected = false,
  onClick
}: PlatformCardProps) {
  return (
    <Tilt
      tiltMaxAngleX={10}
      tiltMaxAngleY={10}
      perspective={1000}
      scale={1.05}
      transitionSpeed={1000}
    >
      <div
        className={`relative group cursor-pointer transition-all duration-300 ${CARD_WIDTH}`}
        onClick={onClick}
      >
        <div className={`absolute -inset-1 bg-gradient-to-r ${color} rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity`}></div>
        <div 
          className="relative bg-background/80 backdrop-blur-sm rounded-xl border border-border p-6 flex flex-col"
          style={{ height: `${CARD_HEIGHT}px`, minHeight: `${CARD_HEIGHT}px`, maxHeight: `${CARD_HEIGHT}px` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 ${title === 'YouTube' || title === 'Gmail' ? 'bg-white' : `bg-gradient-to-r ${color}`} rounded-xl flex items-center justify-center`}>
              {icon === 'gmail-image' ? (
                <Image src="/icons8-gmail-240.png" alt="Gmail" width={40} height={40} className="w-10 h-10" />
              ) : typeof icon === 'string' ? (
                <span className="text-xl">{icon}</span>
              ) : React.createElement(icon, iconProps || {})}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground text-lg">{title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Ready to connect</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          <div className="my-3">
            <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent"></div>
          </div>
          <div className="space-y-2">
            {insights.map((insight, insightIndex) => (
              <div key={insightIndex} className="flex items-start gap-2 text-sm">
                <span className="text-sm opacity-80">{insight}</span>
              </div>
            ))}
          </div>
          <div className="flex-1"></div>
        </div>
      </div>
    </Tilt>
  )
} 