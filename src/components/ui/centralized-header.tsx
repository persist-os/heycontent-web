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

// Types for different header configurations
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
  
  // Special configurations
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

  // Render action button
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
          <span className="hidden sm:inline ml-2">{action.title}</span>
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
          className={`flex items-center gap-2 ${action.className || ''}`}
          title={action.title}
        >
          {buttonContent}
        </Button>
      );
    }

    return (
      <div
        key={action.id}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
          action.active 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted/60 hover:bg-primary text-foreground hover:text-primary-foreground'
        } ${action.className || ''}`}
        title={action.title}
      >
        <IconComponent size={16} />
      </div>
    );
  };

  // Get header variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'minimal':
        return 'border-b border-border bg-background/60 backdrop-blur-sm';
      case 'elevated':
        return 'border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm';
      default:
        return 'border-b border-border bg-background/95 backdrop-blur-sm';
    }
  };

  return (
    <div className={`${getVariantStyles()} ${sticky ? 'sticky top-0 z-10' : ''} ${className}`}>
      <div className="px-4 py-3 flex items-center">
        {/* Left side */}
        <div className="flex-1 flex justify-start items-center gap-2">
          {/* Back button */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 rounded-md transition-colors ml-12"
              title={getBackButtonTitle()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          {/* Left actions */}
          {leftActions.map(renderAction)}
        </div>
        
        {/* Center */}
        <div className="flex-1 flex justify-center">
          <div className="flex flex-col items-center min-h-[24px] justify-center">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center justify-center text-sm text-muted-foreground mb-1">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <ChevronRight className="w-3 h-3 mx-1" />}
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="truncate max-w-20 hover:text-foreground transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <button
                        onClick={crumb.onClick}
                        className="truncate max-w-20 hover:text-foreground transition-colors"
                      >
                        {crumb.label}
                      </button>
                    )}
                  </React.Fragment>
                ))}
                <ChevronRight className="w-3 h-3 mx-1" />
                <span className="text-foreground font-medium">Current</span>
              </div>
            )}
            
            {/* Title */}
            <h1 className="text-base font-medium text-foreground leading-none">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1 leading-none">{subtitle}</p>
            )}
            
            {/* Center actions */}
            {centerActions.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                {centerActions.map(renderAction)}
              </div>
            )}
          </div>
        </div>
        
        {/* Right side */}
        <div className="flex-1 flex justify-end items-center gap-2">
          {/* Right actions */}
          {rightActions.map(renderAction)}
          
          {/* Self tab */}
          {showSelfTab && (
            <Link
              href="/dashboard/self-hub"
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm ${
                pathname.startsWith('/dashboard/self-hub')
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background/80 hover:bg-background text-foreground border border-border'
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
  size: 'sm'
});

export const createStarAction = (
  isStarred: boolean,
  onToggle: () => void
): HeaderAction => ({
  id: 'star',
  icon: Star,
  onClick: onToggle,
  active: isStarred,
  variant: 'ghost'
});

export const createLightbulbAction = (
  isIdeaBank: boolean,
  onToggle: () => void
): HeaderAction => ({
  id: 'lightbulb',
  icon: Lightbulb,
  onClick: onToggle,
  active: isIdeaBank,
  variant: 'ghost'
});

export const createNewChatAction = (
  onNewChat: () => void
): HeaderAction => ({
  id: 'new-chat',
  icon: MessageSquare,
  onClick: onNewChat,
  title: 'New Chat',
  variant: 'outline',
  size: 'sm'
});
