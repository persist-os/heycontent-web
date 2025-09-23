/**
 * Responsive Layout
 *
 * Simple responsive switching between desktop and mobile layouts.
 */

import React from 'react'
import { useLabLayout } from '../hooks/useLabCore'

// Import layout components
import { DesktopSplitLayout } from './DesktopLayouts'
import { MobileTabLayout } from './MobileLayouts'

// TEMPORARY: Mock components - replace with your actual components
const DesktopSplitLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="desktop-layout">
        <div className="split-pane">
            {children}
        </div>
    </div>
)

const MobileTabLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mobile-layout">
        <div className="tab-container">
            {children}
        </div>
    </div>
)

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