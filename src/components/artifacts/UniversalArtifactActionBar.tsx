/**
 * Universal Artifact Action Bar
 * 
 * Pattern: PT:41 (Component-First Development), mobile_friendliness_patterns.md
 * Works for ALL 7 artifact types (download, copy, share)
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Download, Copy, Share2, FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Artifact } from '@/types/artifacts'
import { exportArtifact, ExportFormat } from '@/services/artifactExportService'
import toast from 'react-hot-toast'

interface UniversalArtifactActionBarProps {
  artifact: Artifact
  exportFormats?: ExportFormat[]
  onCopy?: () => void
  onShare?: () => void
}

/**
 * Get available export formats for artifact type
 */
function getExportFormatsForType(artifactType: string): ExportFormat[] {
  const formatMap: Record<string, ExportFormat[]> = {
    structured_list: ['csv', 'excel', 'json'],
    report: ['pdf', 'markdown', 'json'],
    analysis: ['pdf', 'json'],
    summary: ['pdf', 'json'],
    timeline: ['pdf', 'json'],
    tracker: ['csv', 'excel', 'json'],
    email: ['pdf', 'eml', 'json'],
  }
  return formatMap[artifactType] || ['json']
}

export function UniversalArtifactActionBar({
  artifact,
  exportFormats,
  onCopy,
  onShare,
}: UniversalArtifactActionBarProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get available formats (use prop or infer from type)
  const availableFormats = exportFormats || getExportFormatsForType(artifact.type)

  // Handle export
  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true)
      await exportArtifact(artifact._id, format)
      toast.success(`Downloaded as ${format.toUpperCase()}`)
      setIsMobileSheetOpen(false)
    } catch (error: any) {
      console.error('[ArtifactActionBar] Export failed:', error)
      toast.error(error.message || 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      // Copy artifact data as JSON
      const artifactText = JSON.stringify(artifact.data, null, 2)
      await navigator.clipboard.writeText(artifactText)
      toast.success('Copied to clipboard')
      setIsMobileSheetOpen(false)
      onCopy?.()
    } catch (error) {
      console.error('[ArtifactActionBar] Copy failed:', error)
      toast.error('Failed to copy')
    }
  }

  // Handle share (generate shareable link - future: Convex mutation)
  const handleShare = () => {
    // TODO: Generate shareable link via Convex mutation
    toast.success('Share link generated (coming soon)')
    setIsMobileSheetOpen(false)
    onShare?.()
  }

  // Format label helper
  const getFormatLabel = (format: ExportFormat): string => {
    const labels: Record<ExportFormat, string> = {
      pdf: 'PDF',
      csv: 'CSV',
      json: 'JSON',
      markdown: 'Markdown',
      excel: 'Excel',
      eml: 'EML',
    }
    return labels[format] || format.toUpperCase()
  }

  // Desktop: Action bar with dropdown
  const DesktopActionBar = () => (
    <div className="flex items-center gap-2 p-2 border-b border-border/30 bg-background/95 backdrop-blur-sm">
      {/* Download Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="ml-1 hidden sm:inline">Download</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {availableFormats.map((format) => (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
              disabled={isExporting}
            >
              <FileDown className="w-4 h-4 mr-2" />
              {getFormatLabel(format)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Copy Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
      >
        <Copy className="w-4 h-4" />
        <span className="ml-1 hidden sm:inline">Copy</span>
      </Button>

      {/* Share Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
      >
        <Share2 className="w-4 h-4" />
        <span className="ml-1 hidden sm:inline">Share</span>
      </Button>
    </div>
  )

  // Mobile: Bottom sheet trigger + dialog
  const MobileActionBar = () => (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsMobileSheetOpen(true)}
        className="fixed bottom-4 right-4 z-[100] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center min-h-[44px] min-w-[44px]"
        aria-label="Open artifact actions"
      >
        <Download className="w-5 h-5" />
      </button>

      {/* Bottom Sheet Dialog */}
      <Dialog open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
        <DialogContent
          className={cn(
            "fixed bottom-0 left-0 right-0 top-auto translate-y-0 translate-x-0",
            "w-full max-w-none rounded-t-2xl rounded-b-none",
            "max-h-[85vh] p-0 flex flex-col",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom-2",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "z-[80]"
          )}
        >
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle>Artifact Actions</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col p-4 gap-2">
            {/* Download Options */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground px-2">Download</p>
              {availableFormats.map((format) => (
                <Button
                  key={format}
                  variant="outline"
                  className="w-full justify-start min-h-[44px]"
                  onClick={() => handleExport(format)}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <FileDown className="w-4 h-4 mr-2" />
                  )}
                  {getFormatLabel(format)}
                </Button>
              ))}
            </div>

            {/* Copy Button */}
            <Button
              variant="outline"
              className="w-full justify-start min-h-[44px] mt-2"
              onClick={handleCopy}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>

            {/* Share Button */}
            <Button
              variant="outline"
              className="w-full justify-start min-h-[44px]"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )

  // Render based on screen size
  if (isMobile) {
    return <MobileActionBar />
  }

  return <DesktopActionBar />
}

