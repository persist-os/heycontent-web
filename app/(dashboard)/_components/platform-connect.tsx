import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SocialPlatform } from '@/types/social-platforms'
import { Instagram, Mail, Youtube, Video } from 'lucide-react'
import { toast } from 'react-hot-toast'

const PLATFORM_CONFIG = {
  // Social Media Platforms
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    hoverColor: 'hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600',
    description: 'Connect your Instagram account to analyze engagement and find opportunities.'
  },
  youtube: {
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-red-600',
    hoverColor: 'hover:bg-red-700',
    description: 'Connect your YouTube channel to analyze performance and growth.'
  },
  tiktok: {
    name: 'TikTok',
    icon: Video,
    color: 'bg-gradient-to-r from-black to-gray-800',
    hoverColor: 'hover:bg-gradient-to-r hover:from-gray-900 hover:to-black',
    description: 'Connect TikTok to track engagement and trending content.'
  },
  
  // Email Platforms
  gmail: {
    name: 'Gmail',
    icon: Mail,
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
    description: 'Connect Gmail to monitor partnerships and opportunities.'
  },
  outlook: {
    name: 'Outlook',
    icon: Mail,
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    description: 'Connect Outlook to monitor partnerships and opportunities.'
  }
} as const

export function PlatformConnect() {
  const [connecting, setConnecting] = useState<SocialPlatform | null>(null)

  const handleConnect = async (platform: SocialPlatform) => {
    console.log('Button clicked for platform:', platform)
    
    try {
      console.log('Setting connecting state for:', platform)
      setConnecting(platform)

      if (platform === 'instagram') {
        console.log('Starting Instagram connection flow')
        
        const response = await fetch('/api/social/instagram/auth-url')
        console.log('Auth URL response:', response)
        
        if (!response.ok) {
          throw new Error('Failed to get authentication URL')
        }
        
        const data = await response.json()
        console.log('Auth URL data:', data)

        if (!data.authUrl) {
          throw new Error('No authentication URL returned')
        }

        window.location.href = data.authUrl
        return
      }

      // Handle other platforms...
      const response = await fetch('/api/social/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform })
      })

      if (!response.ok) {
        throw new Error('Failed to connect platform')
      }

      const data = await response.json()
      
      if (data.authUrl) {
        window.location.href = data.authUrl
      }

    } catch (error) {
      console.error('Connection error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to connect platform')
    } finally {
      setConnecting(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => (
        <Card key={platform} className="p-6 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-lg ${config.color} flex items-center justify-center`}>
              <config.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold">{config.name}</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-6">
            {config.description}
          </p>

          <Button
            type="button"
            onClick={() => handleConnect(platform as SocialPlatform)}
            variant="default"
            disabled={connecting === platform}
            className={`w-full text-white ${config.hoverColor}`}
            style={{
              background: platform === 'instagram' 
                ? 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))'
                : platform === 'tiktok'
                ? 'linear-gradient(to right, #000000, #1f2937)'
                : platform === 'youtube'
                ? '#dc2626'
                : platform === 'gmail'
                ? '#ef4444'
                : '#3b82f6'
            }}
          >
            {connecting === platform ? 'Connecting...' : 'Connect'}
          </Button>
        </Card>
      ))}
    </div>
  )
} 
