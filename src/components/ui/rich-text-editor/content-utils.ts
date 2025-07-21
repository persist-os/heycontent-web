import { NoteLink } from './rich-text-editor.types'
import { normalizePrefixedId, validatePrefixedId } from '@/lib/content-utils'

export const extractPrefixedIds = (content: string, userId?: string): string[] => {
  if (!content || !userId) return []
  
  const linkRegex = /@\[([^\]]+)\]@/g
  const prefixedIds: string[] = []
  let match
  
  while ((match = linkRegex.exec(content)) !== null) {
    const id = match[1].trim()
    
    // Only process IDs that contain a colon and are not note IDs
    if (id.includes(':') && !id.startsWith('note:')) {
      // Validate the prefixed ID format
      const [contentType, contentId] = id.split(':', 2)
      
      // Ensure both contentType and contentId exist and are not empty
      if (contentType && contentId && contentType.trim() !== '' && contentId.trim() !== '') {
        // Validate contentType is a known type
        const validContentTypes = ['youtube', 'instagram', 'gmail', 'insight']
        if (validContentTypes.includes(contentType)) {
          // Additional validation for specific content types
          if (contentType === 'insight') {
            // Normalize and validate insight IDs (handles legacy 4-part format)
            const normalizedId = normalizePrefixedId(id)
            const validation = validatePrefixedId(normalizedId)
            
            if (validation.isValid) {
              prefixedIds.push(normalizedId)
            } else if (process.env.NODE_ENV === 'development') {
              console.warn('[extractPrefixedIds] Invalid insight ID:', { 
                original: id, 
                normalized: normalizedId, 
                error: validation.error 
              })
            }
          } else {
            // For other content types, ensure contentId is not too short
            if (contentId.length >= 3) {
              prefixedIds.push(id)
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.warn('[extractPrefixedIds] Content ID too short:', { id, contentType, contentId, length: contentId.length })
              }
            }
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[extractPrefixedIds] Unknown content type:', { id, contentType, validTypes: validContentTypes })
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[extractPrefixedIds] Invalid prefixed ID format:', { id, contentType, contentId })
        }
      }
    }
  }
  
  if (process.env.NODE_ENV === 'development' && prefixedIds.length > 0) {
    console.log('[extractPrefixedIds] Extracted valid prefixed IDs:', prefixedIds)
  }
  
  return prefixedIds
}

export const getDisplayContent = (
  rawContent: string,
  availableNotes: NoteLink[],
  fetchedContentTitles: Record<string, string>,
  allLinkableContent?: Array<{ id: string; title: string; type: string }>
): string => {
  if (!rawContent) return rawContent
  
  let displayContent = rawContent
  const linkRegex = /@\[([^\]]+)\]@/g
  let match
  
  while ((match = linkRegex.exec(rawContent)) !== null) {
    const noteId = match[1].trim()
    
    // Handle both prefixed and raw note IDs
    let linkedNote = null
    if (noteId.includes(':')) {
      const [contentType, id] = noteId.split(':', 2)
      if (contentType === 'note') {
        linkedNote = availableNotes.find(note => String(note._id) === String(id))
      } else if (contentType === 'youtube') {
        // Use fetched title or show loading state
        const title = fetchedContentTitles[noteId]
        if (title && title !== 'Error loading title') {
          displayContent = displayContent.replace(match[0], `@[YouTube: ${title}]@`)
        } else {
          // Keep the original prefixed ID if title not fetched yet
          // This prevents conversion to "Missing Note"
          continue
        }
        continue
      } else if (contentType === 'instagram') {
        // Use fetched title or show loading state
        const title = fetchedContentTitles[noteId]
        if (title && title !== 'Error loading title') {
          displayContent = displayContent.replace(match[0], `@[Instagram: ${title}]@`)
        } else {
          // Keep the original prefixed ID if title not fetched yet
          // This prevents conversion to "Missing Note"
          continue
        }
        continue
      } else if (contentType === 'gmail') {
        // Use fetched title or show loading state
        const title = fetchedContentTitles[noteId]
        if (title && title !== 'Error loading title') {
          displayContent = displayContent.replace(match[0], `@[Gmail: ${title}]@`)
        } else {
          // Keep the original prefixed ID if title not fetched yet
          // This prevents conversion to "Missing Note"
          continue
        }
        continue
      } else if (contentType === 'insight') {
        // Handle insight display format
        const insight = allLinkableContent?.find(n => n.id === noteId)
        if (insight) {
          displayContent = displayContent.replace(match[0], `@[Insight: ${insight.title}]@`)
        } else {
          // Keep the original prefixed ID if insight not found
          continue
        }
        continue
      }
    } else {
      // Raw note ID (legacy format) - convert to prefixed format
      linkedNote = availableNotes.find(note => String(note._id) === String(noteId))
      if (linkedNote) {
        // Convert legacy format to new prefixed format
        displayContent = displayContent.replace(match[0], `@[note:${linkedNote._id}]@`)
        // Then convert to display format
        displayContent = displayContent.replace(`@[note:${linkedNote._id}]@`, `@[Smart Note: ${linkedNote.title}]@`)
      }
    }

    // If we reach here, it's a note link that needs to be converted to display format
    if (linkedNote) {
      displayContent = displayContent.replace(match[0], `@[Smart Note: ${linkedNote.title}]@`)
    } else {
      // Note not found, show missing note
      displayContent = displayContent.replace(match[0], `@[Missing Note: ${noteId}]@`)
    }
  }

  return displayContent
}

export const getStorageContent = (
  displayContent: string,
  availableNotes: NoteLink[],
  fetchedContentTitles: Record<string, string>,
  allLinkableContent?: Array<{ id: string; title: string; type: string }>
): string => {
  if (!displayContent) return displayContent
  
  let storageContent = displayContent
  const linkRegex = /@\[([^\]]+)\]@/g
  let match
  
  while ((match = linkRegex.exec(displayContent)) !== null) {
    const titleOrId = match[1].trim()
    
    // If it's already a prefixed ID format, keep it as is
    if (titleOrId.includes(':')) {
      const [contentType, id] = titleOrId.split(':', 2)
      if (contentType === 'note' || contentType === 'youtube' || contentType === 'instagram' || contentType === 'gmail' || contentType === 'insight') {
        // Already in storage format, don't change
        continue
      }
    }
    
    // Handle Smart Note display format
    if (titleOrId.startsWith('Smart Note: ')) {
      const noteTitle = titleOrId.replace('Smart Note: ', '')
      const linkedNote = availableNotes.find(note => note.title === noteTitle)
      if (linkedNote) {
        storageContent = storageContent.replace(match[0], `@[note:${linkedNote._id}]@`)
      }
      continue
    }
    
    // Handle YouTube display format - find the original prefixed ID
    if (titleOrId.startsWith('YouTube: ')) {
      const videoTitle = titleOrId.replace('YouTube: ', '')
      // Find the prefixed ID that matches this title
      const prefixedId = Object.keys(fetchedContentTitles).find(
        id => id.startsWith('youtube:') && fetchedContentTitles[id] === videoTitle
      )
      if (prefixedId) {
        storageContent = storageContent.replace(match[0], `@[${prefixedId}]@`)
      } else {
        // If we can't find the prefixed ID, keep the display format
        // This prevents conversion to "Missing Note"
        continue
      }
      continue
    }
    
    // Handle Instagram display format - find the original prefixed ID
    if (titleOrId.startsWith('Instagram: ')) {
      const postTitle = titleOrId.replace('Instagram: ', '')
      // Find the prefixed ID that matches this title
      const prefixedId = Object.keys(fetchedContentTitles).find(
        id => id.startsWith('instagram:') && fetchedContentTitles[id] === postTitle
      )
      if (prefixedId) {
        storageContent = storageContent.replace(match[0], `@[${prefixedId}]@`)
      } else {
        // If we can't find the prefixed ID, keep the display format
        // This prevents conversion to "Missing Note"
        continue
      }
      continue
    }
    
    // Handle Gmail display format - find the original prefixed ID
    if (titleOrId.startsWith('Gmail: ')) {
      const threadTitle = titleOrId.replace('Gmail: ', '')
      // Find the prefixed ID that matches this title
      const prefixedId = Object.keys(fetchedContentTitles).find(
        id => id.startsWith('gmail:') && fetchedContentTitles[id] === threadTitle
      )
      if (prefixedId) {
        storageContent = storageContent.replace(match[0], `@[${prefixedId}]@`)
      } else {
        // If we can't find the prefixed ID, keep the display format
        // This prevents conversion to "Missing Note"
        continue
      }
      continue
    }
    
    // Handle Insight display format - find the original prefixed ID
    if (titleOrId.startsWith('Insight: ')) {
      const insightTitle = titleOrId.replace('Insight: ', '')
      // Find the insight that matches this title
      const insight = allLinkableContent?.find(n => n.type === 'insight' && n.title === insightTitle)
      if (insight) {
        storageContent = storageContent.replace(match[0], `@[${insight.id}]@`)
      } else {
        // If we can't find the insight, keep the display format
        continue
      }
      continue
    }
    
    // Find note by title (fallback for old format)
    const linkedNote = availableNotes.find(note => note.title === titleOrId)
    if (linkedNote) {
      storageContent = storageContent.replace(match[0], `@[note:${linkedNote._id}]@`)
    }
  }
  return storageContent
} 