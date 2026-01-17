import { useTheme } from 'next-themes'
import { useMemo } from 'react'

/**
 * Theme color utilities to replace hardcoded theme colors throughout the app
 * Uses existing CSS custom properties and provides consistent theme-aware colors
 */

export interface ThemeColors {
  // Primary brand colors
  primary: string
  primaryHover: string
  primaryLight: string
  primaryBorder: string
  
  // Accent colors
  accent: string
  accentHover: string
  accentLight: string
  accentBorder: string
  
  // State colors
  success: string
  warning: string
  error: string
  info: string
  
  // Surface colors
  background: string
  card: string
  border: string
  muted: string
  
  // Text colors
  foreground: string
  mutedForeground: string
}

/**
 * Hook to get theme-aware colors
 * Replaces hardcoded theme color logic in components
 */
export function useThemeColors(): ThemeColors {
  const { theme } = useTheme()
  
  return useMemo(() => {
    const isDark = theme === 'dark'
    
    return {
      // Primary colors using CSS custom properties
      primary: 'hsl(var(--primary))',
      primaryHover: isDark ? 'hsl(var(--primary)/90)' : 'hsl(var(--primary)/90)',
      primaryLight: isDark ? 'hsl(var(--primary)/10)' : 'hsl(var(--primary)/10)',
      primaryBorder: isDark ? 'hsl(var(--primary))' : 'hsl(var(--primary))',
      
      // Accent colors
      accent: 'hsl(var(--accent))',
      accentHover: isDark ? 'hsl(var(--accent)/90)' : 'hsl(var(--accent)/90)',
      accentLight: isDark ? 'hsl(var(--accent)/10)' : 'hsl(var(--accent)/10)',
      accentBorder: isDark ? 'hsl(var(--accent))' : 'hsl(var(--accent))',
      
      // State colors
      success: isDark ? 'hsl(var(--heycontext-green))' : 'hsl(var(--heycontext-green))',
      warning: isDark ? 'hsl(var(--heycontext-yellow))' : 'hsl(var(--heycontext-yellow))',
      error: 'hsl(var(--destructive))',
      info: isDark ? 'hsl(221, 83%, 53%)' : 'hsl(221, 83%, 53%)',
      
      // Surface colors
      background: 'hsl(var(--background))',
      card: 'hsl(var(--card))',
      border: 'hsl(var(--border))',
      muted: 'hsl(var(--muted))',
      
      // Text colors
      foreground: 'hsl(var(--foreground))',
      mutedForeground: 'hsl(var(--muted-foreground))'
    }
  }, [theme])
}

/**
 * Get theme-aware CSS classes for common patterns
 * Provides consistent styling without hardcoding theme logic
 */
export function useThemeClasses() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return useMemo(() => ({
    // Primary accent classes
    accent: {
      text: 'text-primary',
      bg: 'bg-primary',
      bgHover: 'hover:bg-primary/90',
      bgLight: 'bg-primary/10',
      border: 'border-primary'
    },
    
    // Common button patterns
    button: {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
    },
    
    // Layout classes
    layout: {
      panel: 'bg-background border-border',
      card: 'bg-card text-card-foreground border border-border',
      surface: 'bg-muted/30 border-border'
    },
    
    // Interactive states
    interactive: {
      hover: 'hover:bg-accent/50 transition-colors',
      focus: 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      disabled: 'disabled:pointer-events-none disabled:opacity-50'
    }
  }), [isDark])
}

/**
 * Legacy theme color mapping for gradual migration
 * TODO: Remove this once all components use the new system
 */
export function getLegacyThemeColors(theme?: string) {
  const isDark = theme === 'dark'
  
  return {
    accentColor: isDark ? 'text-primary' : 'text-primary',
    accentBg: isDark ? 'bg-primary' : 'bg-primary',
    accentBgHover: isDark ? 'hover:bg-primary/90' : 'hover:bg-primary/90',
    accentBgLight: isDark ? 'bg-primary/10' : 'bg-primary/10',
    accentBorder: isDark ? 'border-primary' : 'border-primary'
  }
}
