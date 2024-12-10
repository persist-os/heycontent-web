import { Card } from '@/components/ui/card'
import { Instagram, Youtube, Video, Mail, CheckCircle2 } from 'lucide-react'
import { SocialPlatform } from '@/types/social-platforms'
import { useState } from 'react'

const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    gradient: 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))',
    description: 'Connect to analyze engagement and find opportunities, and more'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-red-600',
    gradient: '#dc2626',
    description: 'Track channel performance and subscriber growth and more'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Video,
    color: 'bg-gradient-to-r from-black to-gray-800',
    gradient: 'linear-gradient(to right, #000000, #1f2937)',
    description: 'Monitor trending content and engagement metrics and more'
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: Mail,
    color: 'bg-red-500',
    gradient: '#ef4444',
    description: 'Manage partnerships and business communications and more'
  }
] as const

export function PlatformConnect() {
  const [connecting, setConnecting] = useState<SocialPlatform | null>(null)
  const [connectedPlatforms, setConnectedPlatforms] = useState<SocialPlatform[]>([])

  const handleConnect = async (platform: SocialPlatform) => {
    try {
      setConnecting(platform);
      
      const response = await fetch(`/api/social/auth-url?platform=${platform}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL in response');
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert(`Failed to connect to ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setConnecting(null);
    }
  }

  const isConnected = (platform: string) => connectedPlatforms.includes(platform as SocialPlatform)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Platform Integrations</h2>
        <p className="text-muted-foreground">
          Connect your social media accounts to unlock powerful analytics and insights. 
          IRIS will help you track engagement, monitor growth, and identify opportunities across all your platforms.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>{connectedPlatforms.length} of {PLATFORMS.length} platforms connected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLATFORMS.map(platform => (
          <Card key={platform.id} className="p-6 relative">
            {isConnected(platform.id) && (
              <div className="absolute top-4 right-4">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 rounded-lg ${platform.color} flex items-center justify-center`}>
                <platform.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{platform.name}</h3>
                <p className="text-sm text-muted-foreground">{isConnected(platform.id) ? 'Connected' : 'Not connected'}</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              {platform.description}
            </p>
            
            <button
              type="button"
              onClick={() => handleConnect(platform.id as SocialPlatform)}
              disabled={connecting === platform.id || isConnected(platform.id)}
              className="w-full py-2 px-4 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
              style={{ 
                background: isConnected(platform.id) ? '#94A3B8' : platform.gradient
              }}
            >
              {connecting === platform.id 
                ? 'Connecting...' 
                : isConnected(platform.id)
                  ? 'Connected'
                  : 'Connect'
              }
            </button>
          </Card>
        ))}
      </div>
    </div>
  )
} 

