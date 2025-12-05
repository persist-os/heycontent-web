/**
 * Actions and Links Renderer
 * 
 * Pattern: PT:5 (Centralized Abstraction), PT:41 (Component-First Development)
 * Reusable component for rendering actions and links across all artifact types
 */

'use client'

import React from 'react'
import { MapPin, Phone, Mail, ExternalLink, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArtifactAction, ArtifactLink } from '@/types/artifacts'
import { cn } from '@/lib/utils'

interface ActionsAndLinksRendererProps {
  actions?: ArtifactAction[]
  links?: ArtifactLink[]
  className?: string
  variant?: 'default' | 'compact'
}

/**
 * Get action icon
 */
function getActionIcon(actionType: ArtifactAction['type']) {
  switch (actionType) {
    case 'get_directions': return <MapPin className="w-4 h-4" />
    case 'call': return <Phone className="w-4 h-4" />
    case 'email': return <Mail className="w-4 h-4" />
    case 'open_url': return <ExternalLink className="w-4 h-4" />
    case 'copy_to_clipboard': return <Copy className="w-4 h-4" />
    default: return null
  }
}

/**
 * Get action label
 */
function getActionLabel(action: ArtifactAction): string {
  if (action.label) return action.label
  switch (action.type) {
    case 'get_directions': return 'Get Directions'
    case 'call': return 'Call'
    case 'email': return 'Email'
    case 'open_url': return 'Open'
    case 'copy_to_clipboard': return 'Copy'
    default: return 'Action'
  }
}

/**
 * Get action variant (semantic colors)
 */
function getActionVariant(actionType: ArtifactAction['type']): "default" | "secondary" | "outline" {
  switch (actionType) {
    case 'get_directions': return 'default'  // Primary (blue)
    case 'call': return 'secondary'  // Secondary (muted)
    case 'email': return 'secondary'  // Secondary (muted)
    case 'open_url': return 'outline'  // Outline
    case 'copy_to_clipboard': return 'outline'  // Outline
    default: return 'outline'
  }
}

/**
 * Handle action click
 */
function handleActionClick(action: ArtifactAction) {
  if (action.type === 'copy_to_clipboard') {
    navigator.clipboard.writeText(action.url).catch(console.error)
  } else {
    window.open(action.url, '_blank', 'noopener,noreferrer')
  }
}

export function ActionsAndLinksRenderer({
  actions = [],
  links = [],
  className,
  variant = 'default'
}: ActionsAndLinksRendererProps) {
  const validActions = Array.isArray(actions) ? actions : []
  const validLinks = Array.isArray(links) ? links : []

  if (validActions.length === 0 && validLinks.length === 0) {
    return null
  }

  const isCompact = variant === 'compact'

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-2",
      isCompact ? "mt-2" : "mt-3 pt-3 border-t border-border/10",
      className
    )}>
      {/* Actions as buttons */}
      {validActions.map((action, actionIdx) => (
        <Button
          key={`action-${actionIdx}`}
          variant={getActionVariant(action.type)}
          size={isCompact ? "sm" : "sm"}
          onClick={() => handleActionClick(action)}
          className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
        >
          {getActionIcon(action.type)}
          <span className="ml-1">{getActionLabel(action)}</span>
        </Button>
      ))}
      
      {/* Links as clickable text */}
      {validLinks.map((link, linkIdx) => (
        <a
          key={`link-${linkIdx}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline min-h-[44px] flex items-center"
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}

