'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import {
  Users, Settings, FileText, LogOut, BarChart3, Menu, X
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { useSidebar } from '@/app/context/sidebar-context'

const navItems = [
  {
    id: 'chat',
    label: 'Chat With Content',
    icon: Logo,
    href: '/dashboard/chat',
  },
  {
    id: 'content-hub',
    label: 'Content Hub',
    icon: BarChart3,
    href: '/dashboard/content-hub',
  },
  {
    id: 'self-hub',
    label: 'Self',
    icon: Users,
    href: '/dashboard/self-hub',
  },
  {
    id: 'notes',
    label: 'Smart Notes',
    icon: FileText,
    href: '/dashboard/notes',
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { isExpanded, setIsExpanded } = useSidebar();

  const isItemActive = (item: typeof navItems[0]) => {
    switch (item.id) {
      case 'content-hub':
        // This tab is active for multiple, non-nested routes
        return pathname.startsWith('/dashboard/content') || pathname.startsWith('/dashboard/ai-insights');
      case 'self-hub':
        // This tab is active for all its sub-routes
        return pathname.startsWith(item.href);
      case 'chat':
      case 'notes':
        // These tabs are only active on their exact pages, not sub-pages
        return pathname === item.href;
      default:
        return false;
    }
  }

  return (
    <div className={`h-screen fixed top-0 left-0 bg-muted/20 shadow-lg flex flex-col justify-between transition-all duration-300 z-40 ${isExpanded ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-20 md:translate-x-0'}`}>
      <div>
        <div className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} h-20 px-4`}>
            <div className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                {isExpanded && <Logo />}
            </div>
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-md hover:bg-muted hidden md:flex" aria-label="Toggle navigation">
            <Menu className="w-6 h-6"/>
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 mt-8">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center justify-start w-full px-6 h-12 rounded-none transition-colors ${
                isItemActive(item)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted/80'
              }`}
            >
              <div className="w-8 h-8 flex-shrink-0">
                {item.id === 'chat' ? (
                  <Logo disableLink />
                ) : (
                  <item.icon className="w-6 h-6 text-foreground" />
                )}
              </div>
              {isExpanded && <span className="ml-4 text-sm font-medium">{isExpanded ? item.label : ''}</span>}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 mb-4">
        <ThemeToggle />
        <Link
          href="/settings"
          className={`flex items-center w-full px-6 h-12 rounded-none transition-all ${
            pathname === '/settings'
              ? 'bg-muted font-medium'
              : 'hover:bg-muted'
          }`}
        >
          <Settings className="w-6 h-6 text-foreground" />
          {isExpanded && <span className="ml-4 text-sm font-medium">Settings</span>}
        </Link>
      </div>
    </div>
  )
}