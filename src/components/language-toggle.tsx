"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Globe, Search } from "lucide-react"
import { useSmartLanguage } from "@/hooks/useSmartLanguage"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { LANGUAGES, POPULAR_LANGUAGES } from "@/lib/language-constants"

export function LanguageToggle() {
  const { language, setLanguage } = useSmartLanguage()
  const [mounted, setMounted] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        disabled
        className="bg-muted/20 border border-border/40 text-foreground"
      >
        <Globe className="h-[1.2rem] w-[1.2rem] text-foreground" />
        <span className="sr-only">Toggle language</span>
      </Button>
    )
  }

  const popularLanguages = LANGUAGES.filter(lang => 
    POPULAR_LANGUAGES.includes(lang.code as typeof POPULAR_LANGUAGES[number])
  )

  const filteredLanguages = LANGUAGES.filter(lang => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      lang.name.toLowerCase().includes(query) ||
      lang.nativeName.toLowerCase().includes(query) ||
      lang.code.toLowerCase().includes(query)
    )
  })

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
        <DropdownMenuContent align="end" className="min-w-[240px] max-h-[500px] overflow-hidden flex flex-col">
          <div className="px-2 py-2 sticky top-0 bg-background">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>
          
          {!searchQuery && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Popular</div>
              <div className="overflow-y-auto max-h-[180px]">
                {popularLanguages.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code).catch(err => {
                        console.error('[LanguageToggle] Failed to set language:', err);
                      });
                    }}
                    className="cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span className="flex-1">{lang.nativeName}</span>
                    <span className="text-xs text-muted-foreground">{lang.name}</span>
                    {language === lang.code && (
                      <span className="text-xs text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">All Languages</div>
            </>
          )}
          
          <div className="overflow-y-auto flex-1">
            {filteredLanguages.map((lang) => {
              if (!searchQuery && POPULAR_LANGUAGES.includes(lang.code as typeof POPULAR_LANGUAGES[number])) {
                return null
              }
              return (
                <DropdownMenuItem 
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code).catch(err => {
                      console.error('[LanguageToggle] Failed to set language:', err);
                    });
                    setSearchQuery("")
                  }}
                  className="cursor-pointer flex items-center justify-between gap-2"
                >
                  <span className="flex-1">{lang.nativeName}</span>
                  <span className="text-xs text-muted-foreground">{lang.name}</span>
                  {language === lang.code && (
                    <span className="text-xs text-primary">✓</span>
                  )}
                </DropdownMenuItem>
              )
            })}
            {filteredLanguages.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No languages found
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
}

