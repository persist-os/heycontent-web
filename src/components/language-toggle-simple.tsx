"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Globe } from "lucide-react"
import { useSmartLanguage } from "@/hooks/useSmartLanguage"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LANGUAGES, POPULAR_LANGUAGES } from "@/lib/language-constants"

export function LanguageToggleSimple() {
  const { language, setLanguage } = useSmartLanguage()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleLanguageChange = async (newLang: string) => {
    console.log('[LanguageToggleSimple] Changing language to:', newLang);
    try {
      await setLanguage(newLang);
      console.log('[LanguageToggleSimple] Language changed successfully');
    } catch (err) {
      console.error('[LanguageToggleSimple] Failed to set language:', err);
    }
  }

  if (!mounted) {
    return null
  }

  const popularLanguages = LANGUAGES.filter(lang => 
    POPULAR_LANGUAGES.includes(lang.code as typeof POPULAR_LANGUAGES[number])
  )

  const currentLang = LANGUAGES.find(lang => lang.code === language) || LANGUAGES[0]

  return (
    <motion.div
      drag
      dragMomentum={false}
      whileTap={{ scale: 0.95, cursor: "grabbing" }}
      className="cursor-grab"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="bg-muted/20 hover:bg-muted/40 border border-border/40 hover:border-border text-foreground"
            title={`Current: ${currentLang.nativeName}`}
          >
            <Globe className="h-[1.2rem] w-[1.2rem] text-foreground" />
            <span className="sr-only">Toggle language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px] max-h-[400px] overflow-y-auto">
          {popularLanguages.map((lang) => (
            <DropdownMenuItem 
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="cursor-pointer flex items-center justify-between gap-2"
            >
              <span className="flex-1">{lang.nativeName}</span>
              {language === lang.code && (
                <span className="text-xs text-primary">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
}

