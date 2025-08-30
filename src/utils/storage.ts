const SIDEBAR_KEY = 'heycontext-sidebar-state'

export const SidebarStorage = {
  get: (userId?: string): boolean => {
    try {
      const key = userId ? `${SIDEBAR_KEY}-${userId}` : SIDEBAR_KEY
      return localStorage.getItem(key) === 'true'
    } catch {
      return false
    }
  },

  set: (value: boolean, userId?: string): void => {
    try {
      const key = userId ? `${SIDEBAR_KEY}-${userId}` : SIDEBAR_KEY
      localStorage.setItem(key, String(value))
    } catch {
      console.error('Failed to save sidebar state')
    }
  }
} 