import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CreateNoteButton } from '@/components/ui/CreateNoteButton'
import { ChatOverlay } from './ChatOverlay'
import type { OverlayContent } from '../types/chat-container.types'
import type { MarkdownNotepadRef } from './notepad/types'

interface ChatContainerModalsProps {
  showNotepadWarning: boolean
  setShowNotepadWarning: (show: boolean) => void
  overlayContent: OverlayContent | null
  notepadRef: React.RefObject<MarkdownNotepadRef>
  handleConfirmDiscardNotepad: () => void
  handleCancelDiscardNotepad: () => void
  handleOverlayClose: () => void
}

export function ChatContainerModals({
  showNotepadWarning,
  setShowNotepadWarning,
  overlayContent,
  notepadRef,
  handleConfirmDiscardNotepad,
  handleCancelDiscardNotepad,
  handleOverlayClose
}: ChatContainerModalsProps) {
  return (
    <>
      {/* Notepad warning modal */}
      <Dialog open={showNotepadWarning} onOpenChange={setShowNotepadWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Notepad Content</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-foreground text-sm">
            Unsaved notes will be lost. <b>Save as a Smart Note before starting a new chat.</b> Continue?
          </div>
          {/* All three buttons in a row */}
          <div className="flex flex-row gap-3 justify-center mt-4">
            <CreateNoteButton
              content={notepadRef.current?.getContent ? notepadRef.current.getContent() : ''}
              onNoteCreate={() => {
                notepadRef.current?.clearContent()
                setShowNotepadWarning(false)
              }}
              title={"Smart Note"}
            />
            <Button variant="secondary" onClick={handleCancelDiscardNotepad}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDiscardNotepad}>Discard and Start New Chat</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Chat Overlay */}
      {overlayContent && (
        <ChatOverlay
          contentType={overlayContent.contentType}
          contentId={overlayContent.contentId}
          onClose={handleOverlayClose}
        />
      )}
    </>
  )
}
