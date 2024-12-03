'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Brain, 
  Users, 
  MessageSquare, 
  Settings, 
  Briefcase,
  ChevronLeft,
} from 'lucide-react'

const navItems = [
  { 
    id: 'chat', 
    label: 'AI Assistant',
    icon: MessageSquare,
    href: '/chat',
    color: 'text-pink-500'
  },
  { 
    id: 'ai-insights', 
    label: 'AI Insights',
    icon: Brain,
    href: '/ai-insights',
    color: 'text-purple-500'
  },
  { 
    id: 'audience', 
    label: 'Audience DNA',
    icon: Users,
    href: '/audience',
    color: 'text-green-500'
  },
  { 
    id: 'partnerships', 
    label: 'Partnerships',
    icon: Briefcase,
    href: '/partnerships',
    color: 'text-orange-500'
  }
]

const bottomNavItems = [
  { 
    id: 'settings', 
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    color: 'text-gray-500'
  }
]

export function DashboardNav() {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div 
      className={`${
        isExpanded ? 'w-64' : 'w-20'
      } bg-white/80 backdrop-blur-md border-r border-gray-100 flex flex-col h-[calc(100vh-2rem)] justify-between transition-all duration-300`}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-between px-4">
        {isExpanded && <span className="font-semibold text-lg">AVA OwnIt</span>}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${!isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-6">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.includes(item.href)
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-gray-100 font-medium ' + item.color
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? item.color : ''}`} />
                {isExpanded && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="p-3 border-t">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.includes(item.href)
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                isActive 
                  ? 'bg-gray-100 font-medium ' + item.color
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? item.color : ''}`} />
              {isExpanded && <span>{item.label}</span>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}