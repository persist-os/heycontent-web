/**
 * Artifact Export Service
 * 
 * Pattern: PT:1 (Full-Stack API), L:II (API Integration)
 * Uses fetchWithApiKey (no userId in params)
 */

import { fetchWithApiKey } from '@/app/lib/api-helpers'

export type ExportFormat = 'pdf' | 'csv' | 'json' | 'markdown' | 'excel' | 'eml'

export async function exportArtifact(
  artifactId: string,
  format: ExportFormat
): Promise<void> {
  /**
   * Export artifact in specified format.
   * 
   * Pattern: L:II (fetchWithApiKey, no userId in params)
   * 
   * Args:
   *   artifactId: Artifact ID to export
   *   format: Export format
   * 
   * Returns:
   *   Promise that resolves when download starts
   */
  try {
    const response = await fetchWithApiKey('/api/v1/artifacts/export', {
      method: 'POST',
      body: JSON.stringify({
        artifactId,
        format,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Export failed' }))
      throw new Error(error.detail || `Export failed: ${response.statusText}`)
    }

    // Get filename from Content-Disposition header or generate default
    const contentDisposition = response.headers.get('Content-Disposition')
    let filename = `artifact_${artifactId}.${format}`
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }

    // Get content type
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream'

    // Create blob and download
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('[ArtifactExport] Export failed:', error)
    throw error
  }
}

