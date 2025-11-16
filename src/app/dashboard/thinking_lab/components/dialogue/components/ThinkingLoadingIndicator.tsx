import React from 'react'
import { Activity } from 'lucide-react'
import { T } from '@/components/translation'

interface ThinkingLoadingIndicatorProps {
  message?: string
}

export const ThinkingLoadingIndicator: React.FC<ThinkingLoadingIndicatorProps> = ({ 
  message 
}) => {
  return (
    <div className="bg-transparent box-border flex gap-2.5 items-center p-3 rounded-xl">
      <div className="h-5 w-5 relative shrink-0 flex items-center justify-center">
        <Activity className="w-5 h-5 text-primary animate-pulse" />
      </div>
      <p className="flex-1 font-normal leading-5 text-foreground text-base whitespace-pre-wrap">
        {message || <T context="thinking_process.working">Working on it...</T>}
      </p>
    </div>
  )
}

