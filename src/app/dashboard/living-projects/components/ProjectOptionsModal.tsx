'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2, Settings, Eye } from 'lucide-react'

interface ProjectOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  projectName: string
  onDelete: () => void
  onViewDetails?: () => void
  onSettings?: () => void
}

export function ProjectOptionsModal({
  isOpen,
  onClose,
  projectName,
  onDelete,
  onViewDetails,
  onSettings
}: ProjectOptionsModalProps) {
  const handleDelete = () => {
    onDelete()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Project Options</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="text-sm text-muted-foreground mb-4">
            Options for <span className="font-medium text-foreground">"{projectName}"</span>
          </div>
          
          <div className="space-y-2">
            {onViewDetails && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onViewDetails()
                  onClose()
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            )}
            
            {onSettings && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onSettings()
                  onClose()
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Project Settings
              </Button>
            )}
            
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Project
            </Button>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
