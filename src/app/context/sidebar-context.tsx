'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
  isExpanded: boolean
  setIsExpanded: (value: boolean) => void
  isViewingNote: boolean
  setIsViewingNote: (value: boolean) => void
}

const SidebarContext = createContext<SidebarContextType>({
  isExpanded: false,
  setIsExpanded: () => {},
  isViewingNote: false,
  setIsViewingNote: () => {}
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isViewingNote, setIsViewingNote] = useState(false)

  // Initialize from localStorage if available
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('heycontext-sidebar-state')
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
      localStorage.setItem('heycontext-sidebar-state', String(isExpanded))
    } catch (error) {
      console.error('Failed to save sidebar state to localStorage', error)
    }
  }, [isExpanded])

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, isViewingNote, setIsViewingNote }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
