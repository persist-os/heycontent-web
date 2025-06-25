export interface PersonaTimespan {
  personaId: string
  startDate: Date
  endDate: Date
  isLatest: boolean
}

/**
 * Calculate the timespan for a persona based on its position in the sorted array
 * Each persona's timespan starts from its creation date and ends when the next persona was created
 */
export function calculatePersonaTimespan(personas: any[], index: number): PersonaTimespan {
  const current = personas[index]
  const next = personas[index + 1]
  
  return {
    personaId: current._id,
    startDate: new Date(current.createdAt),
    endDate: next ? new Date(next.createdAt) : new Date(), // Now if latest
    isLatest: !next
  }
}

/**
 * Filter an array of items by a timespan using a specified date field
 * @param items Array of items to filter
 * @param timespan The timespan to filter by
 * @param dateField The field name containing the timestamp (e.g., 'createdAt')
 */
export function filterDataByTimespan<T extends Record<string, any>>(
  items: T[], 
  timespan: PersonaTimespan, 
  dateField: string = 'createdAt'
): T[] {
  if (!items || !Array.isArray(items)) return []
  
  const startTime = timespan.startDate.getTime()
  const endTime = timespan.endDate.getTime()
  
  return items.filter(item => {
    let itemTimestamp: number
    
    // Handle different date field formats
    const dateValue = item[dateField]
    if (typeof dateValue === 'number') {
      itemTimestamp = dateValue
    } else if (dateValue instanceof Date) {
      itemTimestamp = dateValue.getTime()
    } else if (typeof dateValue === 'string') {
      itemTimestamp = new Date(dateValue).getTime()
    } else {
      // Fallback to _creationTime if available (Convex documents)
      const fallbackTimestamp = item._creationTime
      if (typeof fallbackTimestamp === 'number') {
        itemTimestamp = fallbackTimestamp
      } else {
        return false
      }
    }
    
    return itemTimestamp >= startTime && itemTimestamp < endTime
  })
}

/**
 * Calculate folder data counts for all personas based on their timespans
 */
export function calculatePersonaFolderData(
  personas: any[],
  conversations: any[],
  notes: any[],
  contentData: any[],
  analyticsData?: any[]
): Map<string, PersonaFolderData> {
  const result = new Map<string, PersonaFolderData>()
  
  personas.forEach((persona, index) => {
    const timespan = calculatePersonaTimespan(personas, index)
    
    // Filter conversations in this timespan
    const timespanConversations = filterDataByTimespan(conversations, timespan, 'createdAt')
    
    // Filter all notes in this timespan
    const timespanNotes = filterDataByTimespan(notes, timespan, 'createdAt')
    
    // Filter content data using consistent date handling
    const timespanContent = contentData.filter(item => {
      let timestamp: number
      
      // Content items use 'date' field primarily, fallback to other fields
      if (item.date instanceof Date) {
        timestamp = item.date.getTime()
      } else if (typeof item.createdAt === 'number') {
        timestamp = item.createdAt
      } else if (typeof item._creationTime === 'number') {
        timestamp = item._creationTime
      } else if (typeof item.data?.timestamp === 'number') {
        // Instagram posts use data.timestamp
        timestamp = item.data.timestamp
      } else if (typeof item.data?.published_at === 'string') {
        // YouTube videos use data.published_at  
        timestamp = new Date(item.data.published_at).getTime()
      } else {
        return false
      }
      
      return timestamp >= timespan.startDate.getTime() && timestamp < timespan.endDate.getTime()
    })
    
    // Filter analytics data using consistent date handling
    const timespanAnalytics = analyticsData ? analyticsData.filter(item => {
      let timestamp: number
      
      // Try different date fields in order of preference
      if (item.date instanceof Date) {
        timestamp = item.date.getTime()
      } else if (typeof item.date === 'number') {
        timestamp = item.date
      } else if (typeof item.date === 'string') {
        timestamp = new Date(item.date).getTime()
      } else if (typeof item.createdAt === 'number') {
        timestamp = item.createdAt
      } else if (item.createdAt instanceof Date) {
        timestamp = item.createdAt.getTime()
      } else if (typeof item._creationTime === 'number') {
        timestamp = item._creationTime
      } else if (typeof item.updatedAt === 'number') {
        // Analytics often use updatedAt for when analysis was generated
        timestamp = item.updatedAt
      } else if (item.updatedAt instanceof Date) {
        timestamp = item.updatedAt.getTime()
      } else {
        return false
      }
      
      const isInTimespan = timestamp >= timespan.startDate.getTime() && timestamp < timespan.endDate.getTime()
      
      return isInTimespan
    }) : []
    
    result.set(persona._id, {
      personaId: persona._id,
      timespan,
      folders: {
        blue: { count: timespanConversations.length, items: timespanConversations },
        purple: { count: timespanNotes.length, items: timespanNotes },
        orange: { count: timespanContent.length, items: timespanContent },
        yellow: { count: timespanAnalytics.length, items: timespanAnalytics }
      }
    })
  })
  
  return result
}

export interface PersonaFolderData {
  personaId: string
  timespan: PersonaTimespan
  folders: {
    blue: { count: number, items: any[] }
    purple: { count: number, items: any[] }
    orange: { count: number, items: any[] }
    yellow: { count: number, items: any[] }
  }
} 