/**
 * Lab Compositions - Minimal Version
 *
 * Simple pre-configured lab container that matches current ChatContainer exactly.
 */

import React from 'react'
import { ThinkingLabProvider } from '../contexts/LabProviders'
import { ResponsiveLayout } from '../layouts/ResponsiveLayout'
import { DialogueComponent } from '../components/DialogueComponent'
import { ReflectionComponent } from '../components/ReflectionComponent'
import { InsightComponent } from '../components/InsightComponent'
import { AmbientComponents } from '../components/AmbientComponents'

// TODO TEMPORARY: Mock components - replace with your actual converted components
const DialogueComponent: React.FC = () => <div>Dialogue Component (convert from ChatContent)</div>
const ReflectionComponent: React.FC = () => <div>Reflection Component (convert from Notepad)</div>
const InsightComponent: React.FC = () => <div>Insight Component (convert from ContextSearch)</div>
const AmbientComponents: React.FC = () => <div>Ambient Components (convert from floating elements)</div>

// =============================================================================
// MAIN LAB COMPOSITION
// =============================================================================

interface LabCompositionProps {
    className?: string
    chatId?: string
    noteId?: string
    askQuery?: string
    contentContext?: any
}

export function FullThinkingLab({
                                    className,
                                    chatId,
                                    noteId,
                                    askQuery,
                                    contentContext
                                }: LabCompositionProps) {
    return (
        <ThinkingLabProvider
            chatId={chatId}
            noteId={noteId}
            askQuery={askQuery}
            contentContext={contentContext}
        >
            <div className={`thinking-lab-full ${className || ''}`}>
                <ResponsiveLayout>
                    <DialogueComponent />
                    <ReflectionComponent />
                    <InsightComponent />
                </ResponsiveLayout>
                <AmbientComponents />
            </div>
        </ThinkingLabProvider>
    )
}

// =============================================================================
// EXPORT
// =============================================================================

export { FullThinkingLab as default }
export type { LabCompositionProps }