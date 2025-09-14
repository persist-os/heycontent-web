'use client'

import React from 'react'
import { 
  Lightbulb, 
  FileText, 
  BarChart3, 
  Users, 
  BookOpen, 
  CheckSquare, 
  Mail,
  FolderOpen
} from 'lucide-react'
import { SharedDropdown } from './SharedDropdown'
import { NoteType } from '../../../../notes/types/index'
import type { Id } from "@/convex/_generated/dataModel"

interface SimpleTypeSelectorProps {
  noteId: string | Id<"notes">
  currentType: NoteType
  onTypeChange: (newType: NoteType) => void
  isMobile?: boolean
  isReadOnly?: boolean
}

const TYPE_CONFIG: Record<NoteType, { 
  label: string 
  description: string 
  color: string 
  icon: React.ReactNode 
}> = {
  idea_bank: { 
    label: 'Ideas', 
    description: 'Thoughts & inspiration', 
    color: 'bg-red-500/80',
    icon: <Lightbulb className="w-3.5 h-3.5" />
  },
  content_script: { 
    label: 'Writing', 
    description: 'Draft & create', 
    color: 'bg-accent',
    icon: <FileText className="w-3.5 h-3.5" />
  },
  collaboration_note: { 
    label: 'People', 
    description: 'Relationships & teams', 
    color: 'bg-green-500/80',
    icon: <Users className="w-3.5 h-3.5" />
  },
  analytics_insight: { 
    label: 'Insights', 
    description: 'Analysis & learnings', 
    color: 'bg-pink-500/80',
    icon: <BarChart3 className="w-3.5 h-3.5" />
  },
  reflection_journal: { 
    label: 'Reflection', 
    description: 'Deep thinking', 
    color: 'bg-blue-500/80',
    icon: <BookOpen className="w-3.5 h-3.5" />
  },
  task_checklist: { 
    label: 'Tasks', 
    description: 'Things to do', 
    color: 'bg-primary',
    icon: <CheckSquare className="w-3.5 h-3.5" />
  },
  email_draft: { 
    label: 'Messages', 
    description: 'Communications', 
    color: 'bg-orange-500/80',
    icon: <Mail className="w-3.5 h-3.5" />
  },
  project: { 
    label: 'Project', 
    description: 'Plans & goals', 
    color: 'bg-purple-500/80',
    icon: <FolderOpen className="w-3.5 h-3.5" />
  },
  idea: { 
    label: 'Idea', 
    description: 'Quick thoughts', 
    color: 'bg-yellow-500/80',
    icon: <Lightbulb className="w-3.5 h-3.5" />
  }
}

export function SimpleTypeSelector({ 
  noteId, 
  currentType, 
  onTypeChange,
  isMobile = false,
  isReadOnly = false
}: SimpleTypeSelectorProps) {
  
  const options = Object.entries(TYPE_CONFIG).map(([type, config]) => ({
    value: type,
    label: config.label,
    description: config.description,
    color: config.color,
    icon: config.icon
  }))

  return (
    <SharedDropdown
      value={currentType}
      options={options}
      onSelect={(value) => onTypeChange(value as NoteType)}
      placeholder="Select type"
      isMobile={isMobile}
      width={isMobile ? "w-24 max-w-24" : "w-28 max-w-28 lg:w-32 lg:max-w-32"}
      triggerClassName="min-w-0 flex-shrink-0 h-8"
      disabled={isReadOnly}
    />
  )
}
