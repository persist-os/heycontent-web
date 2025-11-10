import React from 'react'
import { MarkdownNotepad } from '../notepad/MarkdownNotepad'
import { useNotepadContext } from '../../contexts/NotepadContext'
import { ArtifactPanel } from '../ArtifactPanel'
import { WidgetPanel } from '../WidgetPanel'

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
      {/* Mode Toggle - Fixed */}
      <div className="flex-shrink-0 border-b border-border/20 bg-card/50 backdrop-blur-sm p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setRightPanelMode('notepad')}
            className={`flex-1 px-4 py-3 rounded text-sm transition-colors min-h-[44px] ${
              rightPanelMode === 'notepad'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'hover:bg-accent text-muted-foreground'
            }`}
          >
            Notepad
          </button>
          <button
            onClick={() => setRightPanelMode('artifacts')}
            className={`flex-1 px-4 py-3 rounded text-sm transition-colors min-h-[44px] ${
              rightPanelMode === 'artifacts'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'hover:bg-accent text-muted-foreground'
            }`}
          >
            Artifacts
          </button>
          <button
            onClick={() => setRightPanelMode('widgets')}
            className={`flex-1 px-4 py-3 rounded text-sm transition-colors min-h-[44px] ${
              rightPanelMode === 'widgets'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'hover:bg-accent text-muted-foreground'
            }`}
          >
            Widgets
          </button>
        </div>
      </div>
      
      {/* Panel Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
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

