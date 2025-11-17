import React from 'react'
import { MarkdownNotepad } from '../notepad/MarkdownNotepad'
import { useNotepadContext } from '../../contexts/NotepadContext'
import { ArtifactPanel } from '../ArtifactPanel'
import { WidgetPanel } from '../WidgetPanel'
import { PanelModeSwitcher } from '@/components/ui/PanelModeSwitcher'

interface PanelMobileViewProps {
  rightPanelMode: 'notepad' | 'artifacts' | 'widgets'
  setRightPanelMode: (mode: 'notepad' | 'artifacts' | 'widgets') => void
  noteId?: string
  quotedContent: string
  onClearQuoted: () => void
  projectId?: string
  conversationId?: string
  userId?: string
}

export function PanelMobileView({
  rightPanelMode,
  setRightPanelMode,
  noteId,
  quotedContent,
  onClearQuoted,
  projectId,
  conversationId,
  userId
}: PanelMobileViewProps) {
  const notepadContext = useNotepadContext()
  const notepadRef = React.useRef<any>(null)

  // Set the notepad ref in the context when component mounts
  React.useEffect(() => {
    if (notepadRef.current) {
      notepadContext.setNotepadRef(notepadRef.current)
    }
  }, [notepadContext])

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Panel Mode Switcher - Fixed */}
      {/* Compact layout to avoid overlap with navigation (hamburger menu at left-4) */}
      <div className="flex-shrink-0 border-b border-border/20 bg-card/50 backdrop-blur-sm p-2 flex justify-end">
        <PanelModeSwitcher
          mode={rightPanelMode}
          onModeChange={setRightPanelMode}
        />
      </div>
      
      {/* Panel Content - Scrollable */}
      {/* pb-14: MobileBottomNav height (56px = h-14) */}
      {/* Safe area handled by MobileBottomNav's safe-area-inset-bottom class */}
      <div className="flex-1 overflow-y-auto pb-14">
        {rightPanelMode === 'notepad' ? (
          <div className="h-full">
            <MarkdownNotepad
              ref={notepadRef}
              isOpen={true}
              noteId={noteId}
              quotedContent={quotedContent}
              onClearQuoted={onClearQuoted}
              onClose={() => {}}
              width="100%"
              style={{}}
            />
          </div>
        ) : rightPanelMode === 'artifacts' ? (
          <ArtifactPanel
            projectId={projectId}
            conversationId={conversationId}
            userId={userId}
          />
        ) : userId ? (
          <WidgetPanel
            projectId={projectId}
            conversationId={conversationId}
            userId={userId}
          />
        ) : (
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">Loading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

