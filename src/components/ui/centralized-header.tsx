'use client'

import React from 'react';
import { ArrowLeft, ChevronRight, Lightbulb, Star, Save, Loader2, MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { HelpIconButton } from '@/components/ui/help-icon-button';
import { EnhancedHelpButton } from '@/components/ui/enhanced-help-button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

// Types for different header compositions
export interface HeaderAction {
  id: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  onClick?: () => void;
  title?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
  className?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface CentralizedHeaderProps {
  // Basic configuration
  title: string;
  subtitle?: string;
  
  // Navigation
  showBackButton?: boolean;
  backButtonContext?: string;
  onBack?: () => void;
  
  // Breadcrumbs
  breadcrumbs?: BreadcrumbItem[];
  
  // Actions
  leftActions?: HeaderAction[];
  centerActions?: HeaderAction[];
  rightActions?: HeaderAction[];
  
  // Special compositions
  showThemeToggle?: boolean;
  showSelfTab?: boolean;
  showHelp?: boolean;
  onShowHelp?: () => void;
  onInteractiveTour?: () => void;
  
  // Styling
  className?: string;
  sticky?: boolean;
  variant?: 'default' | 'minimal' | 'elevated';
}

export const CentralizedHeader: React.FC<CentralizedHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  backButtonContext,
  onBack,
  breadcrumbs = [],
  leftActions = [],
  centerActions = [],
  rightActions = [],
  showThemeToggle = true,
  showSelfTab = false,
  showHelp = false,
  onShowHelp,
  onInteractiveTour,
  className = '',
  sticky = true,
  variant = 'default'
}) => {
  const pathname = usePathname();

  // Handle back button click
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  // Get back button title
  const getBackButtonTitle = () => {
    if (backButtonContext) {
      return backButtonContext;
    }
    return "Back";
  };

  // Render action button with anti-corporate styling
  const renderAction = (action: HeaderAction) => {
    const IconComponent = action.icon;
    const buttonContent = (
      <>
        {action.loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <IconComponent size={16} />
        )}
        {action.title && (
          <span className="hidden sm:inline ml-2 text-sm font-medium">{action.title}</span>
        )}
      </>
    );

    if (action.onClick) {
      return (
        <Button
          key={action.id}
          variant={action.variant || 'outline'}
          size={action.size || 'sm'}
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
          className={`flex items-center gap-2 transition-all duration-300 hover:scale-[1.02] ${action.className || ''}`}
          title={action.title}
        >
          {buttonContent}
        </Button>
      );
    }

    return (
      <div
        key={action.id}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 border ${
          action.active 
            ? 'bg-foreground text-background border-foreground/20' 
            : 'bg-muted/30 hover:bg-muted/50 text-foreground border-border/30 hover:border-border/50'
        } ${action.className || ''}`}
        title={action.title}
      >
        <IconComponent size={16} />
      </div>
    );
  };

  // Get header variant styles with anti-corporate design
  const getVariantStyles = () => {
    switch (variant) {
      case 'minimal':
        return 'border-b border-border/30 bg-background/60 backdrop-blur-sm';
      case 'elevated':
        return 'border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm';
      default:
        return 'border-b border-border/30 bg-background/95 backdrop-blur-sm';
    }
  };

  return (
    <div className={`${getVariantStyles()} ${sticky ? 'sticky top-0 z-10' : ''} ${className}`}>
      {/* Subtle gradient line at top */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
      
      <div className="px-6 py-4 flex items-center">
        {/* Left side with asymmetric layout */}
        <div className="flex-1 flex justify-start items-center gap-3">
          {/* Back button with enhanced styling */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 rounded-lg transition-all duration-300 hover:bg-muted/50 hover:scale-[1.02] ml-2"
              title={getBackButtonTitle()}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          
          {/* Left actions with improved spacing */}
          <div className="flex items-center gap-2">
            {leftActions.map(renderAction)}
          </div>
        </div>
        
        {/* Center with asymmetric typography */}
        <div className="flex-1 flex justify-center">
          <div className="flex flex-col items-center min-h-[32px] justify-center space-y-2">
            {/* Breadcrumbs with subtle styling */}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center justify-center text-xs text-muted-foreground/70 mb-2">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <ChevronRight className="w-3 h-3 mx-2 text-muted-foreground/50" />}
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="truncate max-w-24 hover:text-foreground/70 transition-colors duration-300"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <button
                        onClick={crumb.onClick}
                        className="truncate max-w-24 hover:text-foreground/70 transition-colors duration-300"
                      >
                        {crumb.label}
                      </button>
                    )}
                  </React.Fragment>
                ))}
                <ChevronRight className="w-3 h-3 mx-2 text-muted-foreground/50" />
                <span className="text-foreground/80 font-medium">Current</span>
              </div>
            )}
            
            {/* Asymmetric title layout */}
            <div className="flex items-baseline gap-3">
              <h1 className="text-xl font-light tracking-tight text-foreground">
                {title}
              </h1>
              {subtitle && (
                <span className="text-sm font-medium text-muted-foreground/70">
                  {subtitle}
                </span>
              )}
            </div>
            
            {/* Center actions with improved spacing */}
            {centerActions.length > 0 && (
              <div className="flex items-center gap-3 mt-3">
                {centerActions.map(renderAction)}
              </div>
            )}
          </div>
        </div>
        
        {/* Right side with enhanced styling */}
        <div className="flex-1 flex justify-end items-center gap-3">
          {/* Right actions */}
          <div className="flex items-center gap-2">
            {rightActions.map(renderAction)}
          </div>
          
          {/* Self tab with anti-corporate styling */}
          {showSelfTab && (
            <Link
              href="/dashboard/self-hub"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
                pathname.startsWith('/dashboard/self-hub')
                  ? 'bg-foreground text-background hover:bg-foreground/90'
                  : 'bg-muted/30 hover:bg-muted/50 text-foreground border border-border/30 hover:border-border/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Self</span>
            </Link>
          )}
          
          {/* Theme toggle */}
          {showThemeToggle && <ThemeToggle />}
          
          {/* Help button */}
          {showHelp && (
            onInteractiveTour ? (
              <EnhancedHelpButton onInteractiveTour={onInteractiveTour} />
            ) : (
              onShowHelp && <HelpIconButton onClick={onShowHelp} />
            )
          )}
        </div>
      </div>
    </div>
  );
};

// Predefined action creators for common use cases
export const createSaveAction = (
  onSave: () => Promise<void>,
  isSaving = false
): HeaderAction => ({
  id: 'save',
  icon: isSaving ? Loader2 : Save,
  onClick: async () => {
    try {
      await onSave();
      toast.success('Saved successfully', { 
        duration: 1800, 
        position: 'top-center',
        icon: null 
      });
    } catch (err) {
      toast.error('Failed to save');
    }
  },
  title: 'Save',
  loading: isSaving,
  variant: 'outline',
  size: 'sm',
  className: 'border-border/50 hover:border-blue-400/60 transition-colors duration-300'
});

export const createStarAction = (
  isStarred: boolean,
  onToggle: () => void
): HeaderAction => ({
  id: 'star',
  icon: Star,
  onClick: onToggle,
  active: isStarred,
  variant: 'ghost',
  className: isStarred 
    ? 'text-amber-400/80 hover:text-amber-400' 
    : 'text-muted-foreground hover:text-amber-400/60 transition-colors duration-300'
});

export const createLightbulbAction = (
  isIdeaBank: boolean,
  onToggle: () => void
): HeaderAction => ({
  id: 'lightbulb',
  icon: Lightbulb,
  onClick: onToggle,
  active: isIdeaBank,
  variant: 'ghost',
  className: isIdeaBank 
    ? 'text-blue-400/80 hover:text-blue-400' 
    : 'text-muted-foreground hover:text-blue-400/60 transition-colors duration-300'
});

export const createNewChatAction = (
  onNewChat: () => void
): HeaderAction => ({
  id: 'new-chat',
  icon: MessageSquare,
  onClick: onNewChat,
  title: 'New Chat',
  variant: 'outline',
  size: 'sm',
  className: 'border-border/50 hover:border-blue-400/60 transition-colors duration-300'
});
