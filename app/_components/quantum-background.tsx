'use client'

import { useEffect } from 'react'
import styles from './quantum-background.module.css'

interface SuggestionChangeEvent extends CustomEvent {
  detail: string;
}

export function QuantumBackground() {
  useEffect(() => {
    // Keep only the color change code
    const colorSchemes = {
      'brand': { primary: '#4375ED', secondary: '#895FFF' },
      'partnership': { primary: '#FF57BB', secondary: '#895FFF' },
      'pricing': { primary: '#2DD4BF', secondary: '#4375ED' },
      'audience': { primary: '#895FFF', secondary: '#FF57BB' },
      'collaboration': { primary: '#4375ED', secondary: '#2DD4BF' }
    }

    const updateColors = (event: SuggestionChangeEvent) => {
      const suggestion = event.detail
      if (!suggestion) return
      
      const root = document.documentElement
      let scheme = colorSchemes.brand

      Object.entries(colorSchemes).forEach(([key, colors]) => {
        if (suggestion.toLowerCase().includes(key)) {
          scheme = colors
        }
      })

      root.style.setProperty('--ai-blue', scheme.primary)
      root.style.setProperty('--ai-purple', scheme.secondary)
    }

    window.addEventListener('suggestionChange', updateColors as EventListener)

    return () => {
      window.removeEventListener('suggestionChange', updateColors as EventListener)
    }
  }, [])

  return (
    <div className={`${styles.quantumContainer} ${styles.root}`}>
      <div className={styles.networkCore}>
        <div className={styles.aiCore} />
        <div className={styles.dataField} />
      </div>
    </div>
  )
} 