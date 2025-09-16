import { useMemo } from 'react'
import { useTheme } from 'next-themes'

export const useThemeColors = () => {
  const { theme } = useTheme()
  
  return useMemo(() => {
    const isDark = theme === 'dark'
    return {
      isDark,
      accentColor: isDark ? 'text-primary' : 'text-primary',
      accentBg: isDark ? 'bg-primary' : 'bg-primary',
      accentBgHover: isDark ? 'hover:bg-primary/90' : 'hover:bg-primary/90',
      accentBgLight: isDark ? 'bg-primary/10' : 'bg-primary/10',
      accentBorder: isDark ? 'border-primary' : 'border-primary',
      accentFocusBorder: isDark ? 'focus-within:border-primary' : 'focus-within:border-primary'
    }
  }, [theme])
}
