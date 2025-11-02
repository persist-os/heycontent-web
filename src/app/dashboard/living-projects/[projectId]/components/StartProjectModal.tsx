'use client'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

interface StartProjectModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  familyCount: number
  artifactCount: number
  estimatedMinutes: number
  budgetTotal: number
}

/**
 * Confirmation modal for project kickoff.
 * 
 * Shows:
 * - Number of families ready
 * - Estimated completion time
 * - Budget info (daily limit)
 * - What will happen (context for user)
 */
export function StartProjectModal({
  open,
  onClose,
  onConfirm,
  familyCount,
  artifactCount,
  estimatedMinutes,
  budgetTotal
}: StartProjectModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <span>Ready to start project?</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* AI Team Summary */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Your AI Team:</p>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <span>✓</span>
                <span>{familyCount} widget families configured</span>
              </li>
              {artifactCount > 0 && (
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>{artifactCount} artifact shells prepared</span>
                </li>
              )}
            </ul>
          </div>
          
          {/* Estimation */}
          <div className="bg-primary/5 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium">Estimated completion:</p>
            <p className="text-2xl font-bold text-primary">{estimatedMinutes} minutes</p>
          </div>
          
          {/* Budget Info */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Daily AI Power:</p>
            <p className="text-sm flex items-center gap-2">
              <span>⚡</span>
              <span>{budgetTotal} calls/day</span>
              <span className="text-muted-foreground text-xs">(you can adjust anytime)</span>
            </p>
          </div>
          
          {/* What Will Happen */}
          <div className="bg-muted/20 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">What will happen:</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>✓ Families will check if they have enough info</li>
              <li>✓ If yes: They'll create/update artifacts</li>
              <li>✓ If no: They'll ask you questions</li>
              <li>✓ You'll be notified when review is needed</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            <Play className="w-4 h-4 mr-2" />
            Start Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

