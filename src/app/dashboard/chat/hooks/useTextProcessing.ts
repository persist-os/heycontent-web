import { useCallback } from 'react'

interface LinkableContent {
  id: string
  title: string
  content: string
  type: string
  metadata: any
  originalDocument?: any
}

interface UseTextProcessingProps {
  allLinkableContent?: LinkableContent[]
}

export const useTextProcessing = ({ allLinkableContent }: UseTextProcessingProps) => {
  // Function to convert truncated titles back to content IDs
  const convertTitlesToContentIds = useCallback((text: string): string => {
    if (!allLinkableContent) return text
    
    // Find all @[Title] patterns and convert them back to @[contentId]@ format
    let convertedText = text
    
    allLinkableContent.forEach(content => {
      const title = content.title || 'Untitled'
      const truncatedTitle = title.replace(/\n/g, ' ').substring(0, 20) + (title.length > 20 ? '...' : '')
      
      // Replace @[TruncatedTitle] with @[contentId]@
      const titlePattern = new RegExp(`@\\[${truncatedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g')
      convertedText = convertedText.replace(titlePattern, `@[${content.id}]@`)
    })
    
    return convertedText
  }, [allLinkableContent])

  // Function to convert numeric indices to content IDs (for future use)
  const convertNumericIndicesToContentIds = useCallback((text: string): string => {
    // No conversion needed - we use direct content IDs now
    return text
  }, [])

  return {
    convertTitlesToContentIds,
    convertNumericIndicesToContentIds
  }
}
