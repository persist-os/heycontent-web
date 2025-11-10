/**
 * Lab Core Hook
 *
 * Provides access to the lab layout state and actions.
 * Wraps the Zustand store to provide a consistent hook interface.
 */

import { useLayoutStore } from '../stores/layoutStore'
import type { LabLayoutContextValue } from '../types/core/labCore'

/**
 * Hook to access lab layout state and actions
 * 
 * @returns LabLayoutContextValue with state and actions
 */
export function useLabLayout(): LabLayoutContextValue {
  const state = useLayoutStore(state => ({
    isMobile: state.isMobile,
    activeTab: state.activeTab,
    panelSizes: state.panelSizes,
    isReflectionCollapsed: state.isReflectionCollapsed,
    isInsightCollapsed: state.isInsightCollapsed,
  }))

  const actions = useLayoutStore(state => ({
    setMobile: state.setMobile,
    setActiveTab: state.setActiveTab,
    updatePanelSizes: state.updatePanelSizes,
    toggleReflectionCollapse: state.toggleReflectionCollapse,
    toggleInsightCollapse: state.toggleInsightCollapse,
    resetLayout: state.resetLayout,
  }))

  return { state, actions }
}

