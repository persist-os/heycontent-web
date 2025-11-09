/**
 * EDITABLE ARTIFACT RENDERER
 * 
 * Gold Standard wrapper component that auto-wires artifact editing.
 * Eliminates boilerplate - editing just works with zero configuration.
 * 
 * LAW VI: This is the centralization target for artifact editing.
 * All components should use this instead of manually wiring useUnifiedArtifactEditor.
 * 
 * Pattern Compliance: Convex Frontend Data Display Pattern
 * - Components call useMutation directly (via useUnifiedArtifactEditor hook)
 * - No backend calls - direct Convex mutations
 * - Hooks used in components ✅
 * - Stores don't call Convex ✅
 */

'use client'

import React, { useState } from 'react'
import { useUnifiedArtifactEditor } from './editors/useUnifiedArtifactEditor'
import { ArtifactRenderer } from './ArtifactRenderer'
import { Artifact } from '@/types/artifacts'
import { Id } from '@/convex/_generated/dataModel'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Edit, Save, X } from 'lucide-react'
import { ArtifactFormEditor } from './editors/ArtifactFormEditor'

interface ConflictInfo {
  artifactId: string
  expectedVersion: number
  currentVersion: number
  mergeStrategy: 'overwrite' | 'merge' | 'user_precedence'
  message: string
}

interface EditableArtifactRendererProps {
  artifact: Artifact
  userId?: string
  widgetId?: string
  editable?: boolean  // Optional override (default: true)
  onConflict?: (info: ConflictInfo) => void
}

/**
 * EditableArtifactRenderer - Auto-wires artifact editing
 * 
 * Automatically:
 * - Determines edit source (user vs widget) from props
 * - Enables editing by default (opt-out with editable={false})
 * - Handles version tracking
 * - Handles edit source tracking
 * - Handles conflict resolution
 * - Requires zero boilerplate
 */
export function EditableArtifactRenderer({
  artifact,
  userId,
  widgetId,
  editable = true,  // Default to true (editing enabled by default)
  onConflict
}: EditableArtifactRendererProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [formData, setFormData] = useState<any>(artifact.data)
  
  // Auto-wire editing hook
  const editor = useUnifiedArtifactEditor({
    artifactId: artifact._id as Id<'artifacts'>,
    artifactData: artifact.data,
    artifactMetadata: artifact.metadata,  // Pass metadata for version initialization
    userId,
    widgetId: widgetId as Id<'widgets'> | undefined,
    editSource: userId ? 'user' : (widgetId ? 'widget' : 'user'),
    onUpdate: () => {
      // Auto-save via Convex mutation (handled by hook)
      // No action needed - hook handles mutation automatically
    },
    onConflict
  })

  // Handle opening edit modal
  const handleOpenEditModal = () => {
    setFormData(editor.localData)
    setIsEditModalOpen(true)
  }

  // Handle saving edited data
  const handleSaveEdit = async () => {
    const result = await editor.updateData(formData)
    if (result.success) {
      setIsEditModalOpen(false)
    }
    return result
  }

  // Handle cancel
  const handleCancelEdit = () => {
    setFormData(editor.localData) // Reset to original
    setIsEditModalOpen(false)
  }

  // If editing disabled, use regular renderer
  if (!editable) {
    return <ArtifactRenderer artifact={artifact} editable={false} />
  }

  // Editing enabled - pass editor's localData to ArtifactRenderer
  // This ensures optimistic updates are reflected immediately
  
  // Create edit button element to pass to CardHeader
  const editButton = editable ? (
    <Button
      variant="outline"
      size="sm"
      onClick={handleOpenEditModal}
      className="h-7 px-2 text-xs gap-1.5"
      title="Edit entire artifact"
    >
      <Edit className="w-3 h-3" />
      Edit Artifact
    </Button>
  ) : null

  return (
    <>
      <ArtifactRenderer
        artifact={{
          ...artifact,
          data: editor.localData  // Use editor's local state (includes optimistic updates)
        }}
        editable={true}
        onUpdate={editor.updateData}  // Auto-wired update handler
        editButton={editButton}
      />

      {/* Edit Artifact Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Artifact</DialogTitle>
            <DialogDescription>
              Edit the artifact data. Changes will be saved as a new version.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
@            <ArtifactFormEditor
              artifact={artifact}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              isSaving={editor.isSaving}
              formData={formData}
              setFormData={setFormData}
            />
            
            <div className="text-xs text-muted-foreground border-t border-border/20 pt-3">
              <p>• Version: {artifact.metadata?.version || 1}</p>
              <p>• Changes will create version {(artifact.metadata?.version || 1) + 1}</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={editor.isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {editor.isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

