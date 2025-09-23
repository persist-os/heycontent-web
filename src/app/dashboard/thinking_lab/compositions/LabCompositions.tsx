/**
 * Lab Compositions - Simplified Version
 *
 * Uses the original ResponsiveLayout that works correctly.
 * Looks and works exactly like the chat interface.
 */

import React from 'react'
import { ThinkingLabProvider } from '../contexts/LabProviders'
import { useDialogue } from '../hooks/useLabCore'
// Keep ChatContainer layout but use thinking lab content
import { ChatLayout, ChatPanel, ContentArea, InputArea } from '../../chat/components/layout/ChatLayout'
import { PanelExpandButton } from '../../chat/components/PanelExpandButton'

import { MarkdownNotepad } from '../components/notepad/MarkdownNotepad'
import ChatInputArea from '../../chat/components/main_chat/ChatInputArea'
import { BottomBarActions } from '../../chat/components/main_chat/BottomBarActions'
import { AmbientInsights } from '../../chat/components/ambient_insights/AmbientInsights'
import ChatMessagesList from '../../chat/components/main_chat/ChatMessagesList'
import { useSplitScreenLayout } from '../../chat/hooks/useSplitScreenLayout'
import { useOptimizedAuth } from '../../chat/hooks/useOptimizedAuth'

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

function ConnectedBottomActions() {
    const { actions } = useDialogue()
    
    return (
        <BottomBarActions 
            onActionClick={(action) => actions.sendMessage(action)} 
            onInputPopulate={(text) => actions.sendMessage(text)} 
        />
    )
}

function ConnectedChatMessages({ userId }: { userId: string | undefined }) {
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
                if (suggestion.action || suggestion.text) {
                    onSendMessage(suggestion.action || suggestion.text)
                }
            }}
            handleSendMessage={actions.sendMessage}
            onInputPopulate={actions.sendMessage}
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
    
    return (
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
            onInputPopulate={setInputValue}
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
    )
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
                        {/* Header with New Conversation button */}
                        <div className="flex justify-end items-center pb-6 pr-6 pt-6">
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
                                        <ConnectedChatMessages userId={authData.user?.uid} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Welcome view with ambient insights */
                            <>
                                <div className="flex-1 px-6 py-4">
                                    <ConnectedAmbientInsights userId={authData.user?.uid} />
                                </div>
                                
                                {/* Bottom actions when no messages */}
                                <div className="px-6 py-3 border-t border-border">
                                    <ConnectedBottomActions />
                                </div>
                            </>
                        )}
                   
                    </ContentArea>
                    
                    {/* Input area at bottom */}
                    <InputArea>
                        <ConnectedDialogueInput />
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