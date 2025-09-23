/**
 * Responsive Layout with Expandable Panels
 *
 * Full-featured layout with expandable panels, keyboard shortcuts, and smooth animations.
 * Based on the original chat layout system.
 */

import React from 'react'
import { useLabLayout } from '../hooks/useLabCore'
import { useSplitScreenLayout } from '../hooks/useSplitScreenLayout'
import { PanelExpandButton } from '../components/PanelExpandButton'
import { LabLayout, LabPanel, LabContentArea } from '../components/layout/LabLayout'

// =============================================================================
// DESKTOP SPLIT LAYOUT WITH EXPANDABLE PANELS
// =============================================================================

const DesktopSplitLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const childArray = React.Children.toArray(children)
    const splitScreen = useSplitScreenLayout()
    
    return (
        <LabLayout isMobile={false}>
            {/* Dialogue Panel */}
            <LabPanel style={splitScreen.getDialogueContainerStyle()}>
                <PanelExpandButton
                    panelType="dialogue"
                    panelState={splitScreen.panelState}
                    onExpand={splitScreen.setDialogueFullScreen}
                    onRestore={splitScreen.restoreSplitView}
                />
                <LabContentArea>
                    {childArray[0]}
                </LabContentArea>
            </LabPanel>

            {/* Reflection Panel */}
            <LabPanel style={splitScreen.getReflectionContainerStyle()}>
                <PanelExpandButton
                    panelType="reflection"
                    panelState={splitScreen.panelState}
                    onExpand={splitScreen.setReflectionFullScreen}
                    onRestore={splitScreen.restoreSplitView}
                />
                <LabContentArea>
                    {childArray[1]}
                </LabContentArea>
            </LabPanel>
        </LabLayout>
    )
}

const MobileTabLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { state, actions } = useLabLayout()
    const { activeTab } = state
    
    return (
        <LabLayout isMobile={true}>
            {/* Tab Navigation */}
            <div className="flex border-b border-border/30 mb-4 px-4 pt-4">
                <button 
                    onClick={() => actions.setActiveTab('dialogue')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'dialogue' 
                        ? 'border-b-2 border-primary text-primary' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Dialogue
                </button>
                <button 
                    onClick={() => actions.setActiveTab('reflection')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'reflection' 
                        ? 'border-b-2 border-primary text-primary' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Reflection
                </button>
            </div>
            
            {/* Tab Content */}
            <LabContentArea>
                {React.Children.map(children, (child, index) => {
                    const isActive = (
                        (activeTab === 'dialogue' && index === 0) ||
                        (activeTab === 'reflection' && index === 1)
                    )
                    
                    // Only show first 2 children (dialogue and reflection)
                    if (index > 1) return null
                    
                    return (
                        <div 
                            key={index}
                            className={isActive ? 'block h-full' : 'hidden'}
                        >
                            {child}
                        </div>
                    )
                })}
            </LabContentArea>
        </LabLayout>
    )
}

// =============================================================================
// RESPONSIVE LAYOUT COMPONENT
// =============================================================================

interface ResponsiveLayoutProps {
    children: React.ReactNode
    className?: string
}

export function ResponsiveLayout({ children, className }: ResponsiveLayoutProps) {
    const { state } = useLabLayout()
    const { isMobile } = state

    return (
        <div className={`responsive-layout ${className || ''}`}>
            {isMobile ? (
                <MobileTabLayout>{children}</MobileTabLayout>
            ) : (
                <DesktopSplitLayout>{children}</DesktopSplitLayout>
            )}
        </div>
    )
}

// =============================================================================
// SIMPLE MOBILE DETECTION HOOK
// =============================================================================

export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = React.useState(false)

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return isMobile
}

export default ResponsiveLayout