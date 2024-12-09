import { useState, useEffect } from 'react'
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
  }
} as const

export function PlatformConnect() {
  const [connecting, setConnecting] = useState<SocialPlatform | null>(null)

  useEffect(() => {
    console.log('PlatformConnect component mounted');
    console.log('PLATFORM_CONFIG:', PLATFORM_CONFIG);
  }, []);

  const handleConnect = async (platform: SocialPlatform) => {
    if (connecting) return
    
    try {
      setConnecting(platform)
      console.log(`Starting ${platform} connection...`);
      
      let response: Response;
      if (platform === 'instagram') {
        response = await fetch('/api/social/instagram/auth-url')
      } else {
        console.log(`Making POST request for ${platform}...`);
        const requestBody = { platform };
        console.log('Request body:', requestBody);
        
        response = await fetch('/api/social/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
        
        console.log(`Response status:`, response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error response:`, errorText);
          throw new Error(`Server returned ${response.status}: ${errorText}`);
        }
      }

      const data = await response.json()
      console.log(`Got ${platform} response:`, data);

      if (!data.authUrl) {
        throw new Error(`No ${platform} authentication URL returned`)
      }

      console.log(`Redirecting to ${platform} auth URL:`, data.authUrl);
      window.location.href = data.authUrl

    } catch (error) {
      console.error('Connection error:', error)
      alert(error instanceof Error ? error.message : 'Failed to connect platform')
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

          <button
            type="button"
            data-platform={platform}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Button clicked:', platform);
              handleConnect(platform as SocialPlatform);
            }}
            disabled={connecting === platform}
            className={`w-full py-2 px-4 rounded-lg text-white cursor-pointer ${config.hoverColor}`}
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
          </button>
        </Card>
      ))}
    </div>
  )
} 
