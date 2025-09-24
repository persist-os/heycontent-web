/**
 * Lab Compositions
 *
 * Complete composition of the thinking lab.
 * 
 * Includes:
 * - Chat messages list
 * - Input area
 * - Notepad
 * - Ambient insights
 * - Bottom actions
 */

import React from 'react'
import { Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { ThinkingLabProvider } from '../contexts/LabProviders'
import { useDialogue } from '../hooks/useLabCore'
import { ChatLayout, ChatPanel, ContentArea, InputArea } from '../../chat/components/layout/ChatLayout'
import { PanelExpandButton } from '../../chat/components/PanelExpandButton'
import { MarkdownNotepad } from '../components/notepad/MarkdownNotepad'
import ChatInputArea from '../components/dialogue/input/ChatInputArea'
import { BottomBarActions } from '../components/dialogue/components/BottomBarActions'
import { AmbientInsights } from '@/app/dashboard/ambient_insights/AmbientInsights'
import ChatMessagesList from '../components/dialogue/components/ChatMessagesList'
import { useSplitScreenLayout } from '../components/notepad/hooks/useSplitScreenLayout'
import { useOptimizedAuth } from '../components/notepad/hooks/useOptimizedAuth'

// =============================================================================
// THINKING INDICATOR COMPONENT (using existing chat style)
// =============================================================================

interface ThinkingIndicatorProps {
  isVisible: boolean;
  message?: string;
  className?: string;
  onClick?: () => void;
  isExpanded?: boolean;
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  isVisible,
  message = "Thinking...",
  className = "",
  onClick,
  isExpanded = false
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={`mb-3 ${className}`}
        >
          <button
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={onClick}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>{message}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// =============================================================================
// CONNECTED COMPONENTS
// =============================================================================

function ConnectedAmbientInsights({ userId }: { userId: string | undefined }) {
    const { actions } = useDialogue()
    
    return (
        <AmbientInsights
            userId={userId}
            onInsightClick={(action, insight) => {
                // Send a comprehensive message that includes the full insight context
                const fullMessage = `${insight.title}

${insight.description}

${action}`;
                actions.sendMessage(fullMessage)
            }}
        />
    )
}

function ConnectedBottomActions({ onInputPopulate }: { onInputPopulate: (text: string) => void }) {
    const { actions } = useDialogue()

    return (
        <BottomBarActions
            onActionClick={(action) => actions.sendMessage(action)}
            onInputPopulate={onInputPopulate}
        />
    )
}

function ConnectedChatMessages({
    userId,
    onInputPopulate
}: {
    userId: string | undefined,
    onInputPopulate: (text: string) => void
}) {
    const { state, actions } = useDialogue()

    return (
        <ChatMessagesList
            messages={state.messages}
            referencedMessage={null}
            handleMessageReference={() => {}}
            handleReferenceClick={() => {}}
            handleOptionClick={(option) => actions.sendMessage(option)}
            handleFollowUpClick={(choice) => actions.sendMessage(choice)}
            userId={userId}
            handleSuggestionClick={(suggestion, onSendMessage) => {
                // Handle both string suggestions and structured objects
                if (typeof suggestion === 'string') {
                    onSendMessage(suggestion)
                } else if (suggestion.action || suggestion.text || suggestion.description) {
                    onSendMessage(suggestion.action || suggestion.text || suggestion.description)
                }
            }}
            handleSendMessage={actions.sendMessage}
            onInputPopulate={onInputPopulate}
            notepadOpen={true}
            onQuoteToNotepad={() => {}}
            onContentClick={() => {}}
        />
    )
}

function ConnectedDialogueInput() {
    const { state, actions } = useDialogue()
    const inputRef = React.useRef<HTMLTextAreaElement>(null)
    const [inputValue, setInputValue] = React.useState("")
    const [useContextSearch, setUseContextSearch] = React.useState(true)
    const [includeNotepadInMessages, setIncludeNotepadInMessages] = React.useState(false)

    // Function to populate input field - similar to handleInputAppend in other components
    const handleInputPopulate = React.useCallback((text: string) => {
        const cleanText = text
            .replace(/^[\s]*[-*•]\s*/, '') // Remove leading bullet points
            .replace(/^[\s]*\*\s*/, '') // Remove leading asterisks
            .trim()
        setInputValue(currentValue => {
            return currentValue.trim() ? `${currentValue} ${cleanText}` : cleanText
        })
    }, [])

    return {
        inputComponent: (
            <ChatInputArea
                showAmbient={false}
                handleActionClick={actions.sendMessage}
                handleSendMessage={actions.sendMessage}
                inputRef={inputRef}
                isLoading={state.isLoading}
                referencedMessage={null}
                handleClearReference={() => {}}
                includeAnalysisInQuery={true}
                inputValue={inputValue}
                onInputChange={setInputValue}
                onInputPopulate={handleInputPopulate}
                notepadOpen={true}
                openNotepad={() => {}}
                quotedForNotepad=""
                onClearQuoted={() => {}}
                isAuthenticated={true}
                isMobile={false}
                activeTab="chat"
                embeddingInfo={{ hasEmbeddings: false, count: 0 }}
                useContextSearch={useContextSearch}
                onToggleContextSearch={setUseContextSearch}
                includeNotepadInMessages={includeNotepadInMessages}
                onToggleNotepadInMessages={setIncludeNotepadInMessages}
            />
        ),
        handleInputPopulate
    }
}

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
            <LabContent className={className} noteId={noteId} />
        </ThinkingLabProvider>
    )
}

function LabContent({ className, noteId }: { className?: string, noteId?: string }) {
    const splitScreen = useSplitScreenLayout()
    const authData = useOptimizedAuth()
    const { state, actions } = useDialogue()

    // Get the input populate function from ConnectedDialogueInput - call once at the top level
    const { inputComponent, handleInputPopulate } = ConnectedDialogueInput()

    return (
            <ChatLayout isMobile={false} className={className}>
                <ChatPanel style={splitScreen.getChatContainerStyle()}>
                    <PanelExpandButton
                        panelType="chat"
                        panelState={splitScreen.panelState}
                        onExpand={splitScreen.setChatFullScreen}
                        onRestore={splitScreen.restoreSplitView}
                    />
                    <ContentArea>
                        {/* New Conversation button - positioned at top right */}
                        <div className="absolute top-6 right-6 z-10">
                            <button
                                onClick={() => {
                                    actions.startNewConversation()
                                }}
                                className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors duration-300 border-b border-transparent hover:border-current pb-1"
                            >
                                New conversation
                            </button>
                        </div>

                        {/* Conditional content based on messages */}
                        {state.messages.length > 0 ? (
                            /* Messages view */
                            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                                <div className="p-4 sm:p-6">
                                    <div className="max-w-4xl mx-auto space-y-6">
                                        <ConnectedChatMessages
                                            userId={authData.user?.uid}
                                            onInputPopulate={handleInputPopulate}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Welcome view with ambient insights */
                            <>
                                <div className="flex-1 px-6 py-4">
                                    <ConnectedAmbientInsights userId={authData.user?.uid} />

                                    {/* Thinking indicator for ambient insights view */}
                                    <div className="flex justify-center mt-8">
                                        <ThinkingIndicator
                                            isVisible={state.isLoading}
                                            message="Thinking..."
                                        />
                                    </div>
                                </div>

                                {/* Bottom actions when no messages */}
                                <div className="px-6 py-3 border-t border-border">
                                    <ConnectedBottomActions onInputPopulate={handleInputPopulate} />
                                </div>
                            </>
                        )}

                    </ContentArea>

                    {/* Input area at bottom */}
                    <InputArea>
                        {inputComponent}
                    </InputArea>
                </ChatPanel>
                
                {/* Second panel for notepad */}
                <ChatPanel style={splitScreen.getNotepadContainerStyle()}>
                    <PanelExpandButton
                        panelType="notepad"
                        panelState={splitScreen.panelState}
                        onExpand={splitScreen.setNotepadFullScreen}
                        onRestore={splitScreen.restoreSplitView}
                    />
                    <MarkdownNotepad
                        isOpen={true}
                        onClose={() => {}}
                        quotedContent=""
                        onClearQuoted={() => {}}
                        width="100%"
                        style={{}}
                        availableNotes={[]}
                        isMobile={false}
                        noteId={noteId}
                        fromChat={true}
                        canNavigateBack={true}
                        onBack={() => {}}
                        sessionId={state.sessionId || "session-1"}
                        panelState={splitScreen.panelState}
                    />
                </ChatPanel>
            </ChatLayout>
    )
}

// =============================================================================
// EXPORT
// =============================================================================

export { FullThinkingLab as default }
export type { LabCompositionProps }