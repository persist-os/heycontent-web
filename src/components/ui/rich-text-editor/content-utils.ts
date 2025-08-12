import { NoteLink } from './rich-text-editor.types'

export const extractPrefixedIds = (content: string, userId?: string): string[] => {
  if (!content || !userId) return []
  
  console.log('🔍 extractPrefixedIds: Processing content:', content);
  const linkRegex = /@\[([^\]]+)\]@/g
  const prefixedIds: string[] = []
  let match
  
  while ((match = linkRegex.exec(content)) !== null) {
    const id = match[1].trim()
    console.log('🔍 extractPrefixedIds: Found ID:', id);
    
    // Validate the ID format before adding it
    if (id.includes(':') && !id.startsWith('note:')) {
      const [contentType, ...rest] = id.split(':');
      const contentId = rest.join(':');
      
      // Special validation for insights: ensure they have the correct format
      if (contentType === 'insights') {
        // Insights should have format: insights:platform:analysisId:index
        const parts = id.split(':');
        if (parts.length < 4) {
          console.warn('Skipping malformed insight ID:', id);
          continue;
        }
        // For insights, we need to validate that the contentId part has at least 2 colons
        if ((contentId.match(/:/g) || []).length < 2) {
          console.warn('Skipping malformed insight contentId:', contentId);
          continue;
        }
      }
      
      // Only add if the contentId part is valid (no spaces, newlines, etc.)
      if (contentId && 
          contentId.length >= 10 && 
          !contentId.includes(' ') && 
          !contentId.includes('\n') && 
          !contentId.includes('\t') &&
          !contentId.includes('Missing Note')) {
        console.log('🔍 extractPrefixedIds: Adding prefixed ID:', id);
        prefixedIds.push(id)
      } else {
        console.log('🔍 extractPrefixedIds: Skipping invalid ID:', { id, contentId, reason: 'validation failed' });
      }
    }
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
      if (contentType === 'note' || contentType === 'notes') {
        // Use fetched title or fallback to availableNotes
        const title = fetchedContentTitles[noteId]
        if (title && title !== 'Error loading title') {
          displayContent = displayContent.replace(match[0], `@[Smart Note: ${title}]@`)
        } else {
          // Fallback to availableNotes if title not fetched
          linkedNote = availableNotes.find(note => String(note._id) === String(id))
        }
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
      } else if (contentType === 'insights' || contentType === 'insight') {
        // Handle insight display format
        console.log('🔍 Processing insight for display:', { noteId, title: fetchedContentTitles[noteId] });
        const title = fetchedContentTitles[noteId]
        if (title && title !== 'Error loading title') {
          // Clean the title for inline display - remove newlines and truncate
          let cleanTitle = title.replace(/[\r\n]+/g, ' ').trim(); // Remove newlines
          cleanTitle = cleanTitle.replace(/\s+/g, ' '); // Replace multiple spaces with single space
          
          // Truncate if too long for inline display
          if (cleanTitle.length > 50) {
            cleanTitle = cleanTitle.substring(0, 47) + '...';
          }
          
          displayContent = displayContent.replace(match[0], `@[Insight: ${cleanTitle}]@`)
        } else {
          // Keep the original prefixed ID if title not fetched yet
          continue
        }
        continue
      } else if (contentType === 'conversations') {
        // Handle conversation display format
        const title = fetchedContentTitles[noteId]
        if (title && title !== 'Error loading title') {
          // Clean the title for inline display - remove newlines and truncate
          let cleanTitle = title.replace(/[\r\n]+/g, ' ').trim(); // Remove newlines
          cleanTitle = cleanTitle.replace(/\s+/g, ' '); // Replace multiple spaces with single space
          
          // Truncate if too long for inline display
          if (cleanTitle.length > 50) {
            cleanTitle = cleanTitle.substring(0, 47) + '...';
          }
          
          displayContent = displayContent.replace(match[0], `@[Conversation: ${cleanTitle}]@`)
        } else {
          // Keep the original prefixed ID if title not fetched yet
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
        const noteTitle = linkedNote.title || 'Untitled Note'
        displayContent = displayContent.replace(`@[note:${linkedNote._id}]@`, `@[Smart Note: ${noteTitle}]@`)
      }
    }
    
    if (linkedNote) {
      // Replace @[note:id]@ with @[Smart Note: Title]@ for display
      const noteTitle = linkedNote.title || 'Untitled Note'
      displayContent = displayContent.replace(match[0], `@[Smart Note: ${noteTitle}]@`)
    } else {
      // Show [Missing Note] for unknown IDs
      displayContent = displayContent.replace(match[0], `@[Missing Note]@`)
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
      if (contentType === 'note' || contentType === 'notes' || contentType === 'youtube' || contentType === 'instagram' || contentType === 'gmail' || contentType === 'insight' || contentType === 'insights' || contentType === 'conversations') {
        // Already in storage format, don't change
        continue
      }
    }
    
    // Handle Smart Note display format
    if (titleOrId.startsWith('Smart Note: ')) {
      const noteTitle = titleOrId.replace('Smart Note: ', '')
      // Handle both exact title match and "Untitled Note" case
      let linkedNote = availableNotes.find(note => note.title === noteTitle)
      
      // If not found and title is "Untitled Note", look for notes with empty titles
      if (!linkedNote && noteTitle === 'Untitled Note') {
        linkedNote = availableNotes.find(note => !note.title || note.title.trim() === '')
      }
      
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
      console.log('🔍 getStorageContent: Looking for insight title:', insightTitle);
      console.log('🔍 getStorageContent: Available fetchedContentTitles:', fetchedContentTitles);
      
      // Find the prefixed ID that matches this title
      const prefixedId = Object.keys(fetchedContentTitles).find(
        id => id.startsWith('insights:') && (
          fetchedContentTitles[id] === insightTitle || 
          fetchedContentTitles[id].startsWith(insightTitle.replace('...', ''))
        )
      )
      console.log('🔍 getStorageContent: Found prefixedId for insight:', prefixedId);
      
      if (prefixedId) {
        storageContent = storageContent.replace(match[0], `@[${prefixedId}]@`)
      } else {
        // If we can't find the prefixed ID, keep the display format
        // This prevents conversion to "Missing Note"
        console.log('🔍 getStorageContent: No prefixedId found for insight, keeping display format');
        continue
      }
      continue
    }
    
    // Handle Conversation display format - find the original prefixed ID
    if (titleOrId.startsWith('Conversation: ')) {
      const conversationTitle = titleOrId.replace('Conversation: ', '')
      // Find the prefixed ID that matches this title
      const prefixedId = Object.keys(fetchedContentTitles).find(
        id => id.startsWith('conversations:') && fetchedContentTitles[id] === conversationTitle
      )
      if (prefixedId) {
        storageContent = storageContent.replace(match[0], `@[${prefixedId}]@`)
      } else {
        // If we can't find the prefixed ID, keep the display format
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