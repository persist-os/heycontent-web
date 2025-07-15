'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

interface PlatformConnectionPromptProps {
  platformName: string
  platformIcon: React.ReactNode
  description: string
  buttonColor: string
  buttonHoverColor: string
}

export function PlatformConnectionPrompt({
  platformName,
  platformIcon,
  description,
  buttonColor,
  buttonHoverColor,
}: PlatformConnectionPromptProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[400px] px-4">
      <Card className="p-6 sm:p-8 max-w-md w-full min-h-[320px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl text-center flex flex-col justify-between">
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            {platformIcon}
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
            Connect Your {platformName} Account
          </h3>
          
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm leading-relaxed">
            {description}
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <Button 
            onClick={() => router.push('/settings?tab=integrations')}
            className={`w-full py-3 px-4 sm:px-6 ${buttonColor} ${buttonHoverColor} text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base`}
          >
            <Settings className="w-4 h-4" />
            Go to Integrations
          </Button>
          
          <div className="mt-3 sm:mt-4 text-xs text-gray-500">
            You can connect {platformName} in Settings → Integrations
          </div>
        </div>
      </Card>
    </div>
  )
} 