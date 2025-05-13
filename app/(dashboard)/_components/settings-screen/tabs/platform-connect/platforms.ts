import { Instagram, Youtube, Video, Mail } from 'lucide-react';

export const PLATFORMS = [
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
    id: 'gmail',
    name: 'Gmail',
    icon: Mail,
    color: 'bg-red-500',
    gradient: '#ef4444',
    description: 'Manage partnerships and business communications and more'
  }
] as const;

export type PlatformType = typeof PLATFORMS[number];
