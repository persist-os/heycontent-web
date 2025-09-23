/**
 * Core Lab Hooks
 *
 * Type-safe access hooks for thinking lab contexts.
 * Provides clean access to dialogue, reflection, insight, and layout features.
 */

import { useContext } from 'react'
import {
    DialogueContext,
    ReflectionContext,
    InsightContext,
    LabLayoutContext
} from '../contexts/LabContexts'
import type {
    DialogueContextValue,
    ReflectionContextValue,
    InsightContextValue,
    LabLayoutContextValue
} from '../types'

// =============================================================================
// INDIVIDUAL CONTEXT HOOKS
// =============================================================================

export function useDialogue(): DialogueContextValue {
    const context = useContext(DialogueContext)
    if (!context) {
        throw new Error('useDialogue must be used within a DialogueProvider')
    }
    return context
}

export function useReflection(): ReflectionContextValue {
    const context = useContext(ReflectionContext)
    if (!context) {
        throw new Error('useReflection must be used within a ReflectionProvider')
    }
    return context
}

export function useInsight(): InsightContextValue {
    const context = useContext(InsightContext)
    if (!context) {
        throw new Error('useInsight must be used within an InsightProvider')
    }
    return context
}

export function useLabLayout(): LabLayoutContextValue {
    const context = useContext(LabLayoutContext)
    if (!context) {
        throw new Error('useLabLayout must be used within a LabLayoutProvider')
    }
    return context
}

// =============================================================================
// OPTIONAL CONTEXT HOOKS (don't throw if missing)
// =============================================================================

export function useDialogueOptional(): DialogueContextValue | null {
    return useContext(DialogueContext)
}

export function useReflectionOptional(): ReflectionContextValue | null {
    return useContext(ReflectionContext)
}

export function useInsightOptional(): InsightContextValue | null {
    return useContext(InsightContext)
}

export function useLabLayoutOptional(): LabLayoutContextValue | null {
    return useContext(LabLayoutContext)
}

// =============================================================================
// FEATURE DETECTION HOOKS
// =============================================================================

export function useLabFeatureDetection() {
    const dialogue = useDialogueOptional()
    const reflection = useReflectionOptional()
    const insight = useInsightOptional()
    const layout = useLabLayoutOptional()

    return {
        hasDialogue: !!dialogue,
        hasReflection: !!reflection,
        hasInsight: !!insight,
        hasLayout: !!layout,
        availableFeatures: [
            dialogue && 'dialogue',
            reflection && 'reflection',
            insight && 'insight',
            layout && 'layout'
        ].filter(Boolean) as string[]
    }
}

// =============================================================================
// SIMPLE COMPOSITE HOOKS
// =============================================================================

export function useLabFeatures() {
    const dialogue = useDialogueOptional()
    const reflection = useReflectionOptional()
    const insight = useInsightOptional()
    const layout = useLabLayoutOptional()

    return {
        dialogue,
        reflection,
        insight,
        layout
    }
}

export function useLabState() {
    const features = useLabFeatures()

    return {
        isDialogueActive: !!features.dialogue,
        isReflectionOpen: features.reflection?.state.isOpen ?? false,
        isSearchEnabled: features.insight?.state.searchEnabled ?? false,
        isMobile: features.layout?.state.isMobile ?? false,
        activeTab: features.layout?.state.activeTab ?? 'dialogue'
    }
}
