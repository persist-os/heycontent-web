import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Instagram, Youtube, Video, Mail, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { SocialPlatform } from '@/app/types/social-platforms'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface ConnectedAccount {
  platform: SocialPlatform
  username: string
  metadata: any
  lastUpdated: Date | string
  isActive: boolean
}

const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    gradient: 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))',
    description: 'Connect to analyze engagement and find opportunities, and more',
    connectionOptions: [
      {
        id: 'basic',
        name: 'Basic Connection',
        description: 'For professional accounts without Facebook Business',
        features: ['View profile info', 'Read media content']
      },
      {
        id: 'facebook',
        name: 'Business Connection',
        description: 'Access advanced Instagram features through Facebook Business (Facebook Page required for setup only)',
        features: [
          'Instagram account analytics',
          'Instagram comments management',
          'Instagram post insights',
          'Instagram content publishing (Coming soon)'
        ],
        requirements: [
          'Instagram Professional Account',
          'Facebook Page (for verification only)',
          'Facebook Business Account'
        ]
      }
    ]
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
  const [disconnecting, setDisconnecting] = useState<SocialPlatform | null>(null)
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showInstagramOptions, setShowInstagramOptions] = useState(false)

  const fetchConnectedPlatforms = async () => {
    try {
      console.log('Starting to fetch connected platforms...')
      setLoading(true)
      const response = await fetch('/api/social/connected-platforms')
      
      console.log('Response status:', response.status)
      const responseText = await response.text()
      console.log('Raw response:', responseText)
      
      if (!response.ok) {
        console.error('Failed to fetch platforms:', responseText)
        return
      }
      
      const data = JSON.parse(responseText)
      console.log('Parsed platform data:', data)
      console.log('Connected accounts:', data.accounts)
      
      setConnectedAccounts(data.accounts || [])
    } catch (error) {
      console.error('Error fetching connected platforms:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConnectedPlatforms()
  }, [])

  useEffect(() => {
    // Check for error in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error === 'no_pages_found') {
      toast.error(
        'Facebook Page required. Please create a Facebook Page and connect it to your Instagram Professional account first.',
        { duration: 6000 }
      );
    }
  }, []);

  const handleConnect = async (platform: SocialPlatform, options?: { useFacebook?: boolean }) => {
    try {
      setConnecting(platform)
      
      let url = `/api/social/auth-url?platform=${platform}`
      if (options?.useFacebook !== undefined) {
        url += `&useFacebook=${options.useFacebook}`
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        throw new Error('No auth URL in response')
      }
    } catch (error) {
      console.error('Connection error:', error)
      toast.error(`Failed to connect to ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setConnecting(null)
      setShowInstagramOptions(false)
    }
  }

  const handleDisconnect = async (platform: SocialPlatform) => {
    try {
      setDisconnecting(platform)
      
      const response = await fetch('/api/social/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Refresh the connected platforms list
      await fetchConnectedPlatforms()
      toast.success(`Successfully disconnected ${platform}`)
    } catch (error) {
      console.error('Disconnection error:', error)
      toast.error(`Failed to disconnect ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDisconnecting(null)
    }
  }

  const getAccountDetails = (platform: string) => {
    return connectedAccounts.find(account => account.platform === platform)
  }

  const renderMetrics = (platform: string, metadata: any) => {
    if (!metadata) return null

    switch (platform) {
      case 'youtube':
        return (
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
            <div>Subscribers: {metadata.subscribers || 0}</div>
            <div>Videos: {metadata.videos || 0}</div>
            <div>Total Views: {metadata.views || 0}</div>
          </div>
        )
      case 'gmail':
        return (
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
            <div>Total Messages: {metadata.messagesTotal || 0}</div>
            <div>Total Threads: {metadata.threadsTotal || 0}</div>
          </div>
        )
      default:
        return null
    }
  }

  const renderConnectionButton = (platform: typeof PLATFORMS[number]) => {
    const account = getAccountDetails(platform.id)
    const isLoading = connecting === platform.id || disconnecting === platform.id

    if (account) {
      return (
        <button
          type="button"
          onClick={() => handleDisconnect(platform.id as SocialPlatform)}
          disabled={isLoading}
          className="w-full py-2 px-4 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
          style={{ background: '#94A3B8' }}
        >
          {isLoading ? 'Disconnecting...' : 'Disconnect'}
        </button>
      )
    }

    if (platform.id === 'instagram' && !account) {
      return (
        <div className="space-y-2">
          {showInstagramOptions ? (
            <>
              <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {platform.connectionOptions?.map((option) => (
                  <div key={option.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{option.name}</h4>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleConnect(platform.id as SocialPlatform, { 
                          useFacebook: option.id === 'facebook' 
                        })}
                        className="px-3 py-1 text-sm rounded-md text-white"
                        style={{ background: platform.gradient }}
                      >
                        Select
                      </button>
                    </div>
                    <ul className="text-sm text-gray-600 list-disc list-inside pl-2">
                      {option.features.map((feature, i) => (
                        <li key={i}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setShowInstagramOptions(false)}
                  className="w-full py-2 px-4 rounded-lg text-gray-600 bg-gray-200 hover:bg-gray-300 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowInstagramOptions(true)}
              disabled={isLoading}
              className="w-full py-2 px-4 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
              style={{ background: platform.gradient }}
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      )
    }

    return (
      <button
        type="button"
        onClick={() => handleConnect(platform.id as SocialPlatform)}
        disabled={isLoading}
        className="w-full py-2 px-4 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
        style={{ background: platform.gradient }}
      >
        {isLoading ? 'Connecting...' : 'Connect'}
      </button>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Platform Integrations</h2>
          <p className="text-muted-foreground">Loading connected platforms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Platform Integrations</h2>
        <p className="text-muted-foreground">
          Connect your social media accounts to unlock powerful analytics and insights. 
          Content will help you track engagement, monitor growth, and identify opportunities across all your platforms.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>{connectedAccounts.length} of {PLATFORMS.length} platforms connected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLATFORMS.map(platform => {
          const account = getAccountDetails(platform.id)
          const isLoading = connecting === platform.id || disconnecting === platform.id

          return (
            <Card key={platform.id} className="p-6 relative">
              {account && !isLoading && (
                <div className="absolute top-4 right-4">
                  {account.isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
              )}
              {isLoading && (
                <div className="absolute top-4 right-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-12 h-12 rounded-lg ${platform.color} flex items-center justify-center`}>
                  <platform.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{platform.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isLoading 
                      ? (connecting ? 'Connecting...' : 'Disconnecting...') 
                      : account 
                        ? `Connected as ${account.username}`
                        : 'Not connected'}
                  </p>
                </div>
              </div>
              
              {account && (
                <>
                  {renderMetrics(platform.id, account.metadata)}
                  <div className="mt-2 text-xs text-gray-500">
                    Last updated: {formatDistanceToNow(new Date(account.lastUpdated), { addSuffix: true })}
                  </div>
                </>
              )}
              
              <p className="text-sm text-muted-foreground my-4">
                {platform.description}
              </p>
              
              {renderConnectionButton(platform)}
            </Card>
          )
        })}
      </div>
    </div>
  )
} 

