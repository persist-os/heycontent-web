/**
 * Lab Context Definitions
 *
 * Core React contexts and TypeScript interfaces for the collaborative thinking lab.
 * Contains only context definitions and types - no implementation logic.
 */

import { createContext } from 'react'
import type {
    DialogueContextValue,
    ReflectionContextValue,
    InsightContextValue,
    LabLayoutContextValue,
    LabTab
} from '../types'

// =============================================================================
// DIALOGUE CONTEXT
// =============================================================================

export const DialogueContext = createContext<DialogueContextValue | null>(null)

// =============================================================================
// REFLECTION CONTEXT
// =============================================================================

export const ReflectionContext = createContext<ReflectionContextValue | null>(null)

// =============================================================================
// INSIGHT CONTEXT
// =============================================================================

export const InsightContext = createContext<InsightContextValue | null>(null)

// =============================================================================
// LAB LAYOUT CONTEXT
// =============================================================================

export const LabLayoutContext = createContext<LabLayoutContextValue | null>(null)

// =============================================================================
// RE-EXPORT TYPES FOR BACKWARDS COMPATIBILITY
// =============================================================================

// Provider prop interfaces are now centralized in types/core/labCore.ts
// Re-exported here for any existing imports
export type {
    DialogueProviderProps,
    ReflectionProviderProps,
    InsightProviderProps,
    LabLayoutProviderProps,
    ThinkingLabProviderProps
} from '../types/core/labCore'