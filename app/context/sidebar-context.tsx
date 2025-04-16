'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
  isExpanded: boolean
  setIsExpanded: (value: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Initialize from localStorage if available
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('heycontent-sidebar-state')
      if (savedState !== null) {
        setIsExpanded(savedState === 'true')
      }
    } catch (error) {
      console.error('Failed to load sidebar state from localStorage', error)
    }
  }, [])

  // Save to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem('heycontent-sidebar-state', String(isExpanded))
    } catch (error) {
      console.error('Failed to save sidebar state to localStorage', error)
    }
  }, [isExpanded])

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
