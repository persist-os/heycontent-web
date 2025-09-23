/**
 * Layout Store
 *
 * Zustand store for managing responsive layout state and panel configurations.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

type LabTab = 'dialogue' | 'reflection' | 'insight'

interface PanelSizes {
    dialogue: number
    reflection: number
}

interface LayoutState {
    isMobile: boolean
    activeTab: LabTab
    panelSizes: PanelSizes
    isReflectionCollapsed: boolean
    isInsightCollapsed: boolean
}

interface LayoutActions {
    setMobile: (isMobile: boolean) => void
    setActiveTab: (tab: LabTab) => void
    updatePanelSizes: (sizes: Partial<PanelSizes>) => void
    toggleReflectionCollapse: () => void
    toggleInsightCollapse: () => void
    resetLayout: () => void
}

type LayoutStore = LayoutState & LayoutActions

const defaultPanelSizes: PanelSizes = {
    dialogue: 60,
    reflection: 40
}

export const useLayoutStore = create<LayoutStore>()(
    subscribeWithSelector((set, get) => ({
        // Initial state
        isMobile: false,
        activeTab: 'dialogue',
        panelSizes: defaultPanelSizes,
        isReflectionCollapsed: false,
        isInsightCollapsed: false,

        // Actions
        setMobile: (isMobile: boolean) => {
            set({ isMobile })

            // TODO: Should we auto-switch to a specific tab on mobile?
            if (isMobile) {
                // Maybe set to dialogue tab by default on mobile
                set({ activeTab: 'dialogue' })
            }
        },

        setActiveTab: (tab: LabTab) => {
            set({ activeTab: tab })
        },

        updatePanelSizes: (sizes: Partial<PanelSizes>) => {
            set(state => ({
                panelSizes: { ...state.panelSizes, ...sizes }
            }))
        },

        toggleReflectionCollapse: () => {
            set(state => ({
                isReflectionCollapsed: !state.isReflectionCollapsed
            }))
        },

        toggleInsightCollapse: () => {
            set(state => ({
                isInsightCollapsed: !state.isInsightCollapsed
            }))
        },

        resetLayout: () => {
            set({
                panelSizes: defaultPanelSizes,
                isReflectionCollapsed: false,
                isInsightCollapsed: false,
                activeTab: 'dialogue'
            })
        }
    }))
)

// Responsive detection hook
export function useResponsiveDetection() {
    React.useEffect(() => {
        const checkMobile = () => {
            const isMobile = window.innerWidth < 768 // TODO: Adjust breakpoint as needed
            useLayoutStore.getState().setMobile(isMobile)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])
}

// TODO: Add any additional selectors you need
export const useLayoutState = () => useLayoutStore(state => ({
    isMobile: state.isMobile,
    activeTab: state.activeTab,
    panelSizes: state.panelSizes
}))

export const useLayoutActions = () => useLayoutStore(state => ({
    setActiveTab: state.setActiveTab,
    updatePanelSizes: state.updatePanelSizes,
    toggleReflectionCollapse: state.toggleReflectionCollapse,
    resetLayout: state.resetLayout
}))