/**
 * WIDGET DASHBOARD UTILITIES
 * 
 * Shared utility functions for widget dashboard
 */

export const truncateContent = (content: string, maxLength: number = 150): string => {
  if (!content) return 'No content preview available'
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + '...'
}

export const getPriorityColor = (priority: number): string => {
  if (priority >= 8) return 'text-red-600 dark:text-red-400'
  if (priority >= 6) return 'text-orange-600 dark:text-orange-400'
  if (priority >= 4) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-green-600 dark:text-green-400'
}

export const getPriorityLabel = (priority: number): string => {
  if (priority >= 8) return 'Critical'
  if (priority >= 6) return 'High'
  if (priority >= 4) return 'Medium'
  return 'Low'
}

export const getPriorityGradient = (priority: number): string => {
  if (priority >= 8) return 'bg-gradient-to-r from-red-500 to-red-600'
  if (priority >= 6) return 'bg-gradient-to-r from-orange-500 to-orange-600'
  if (priority >= 4) return 'bg-gradient-to-r from-yellow-500 to-yellow-600'
  return 'bg-gradient-to-r from-green-500 to-green-600'
}

