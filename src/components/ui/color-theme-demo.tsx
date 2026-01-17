import React from 'react';
import { ThemeToggle } from '../theme-toggle';

export function ColorThemeDemo() {
  // Core brand colors
  const brandColors = [
    { 
      name: 'HeyContext Yellow (Primary)', 
      class: 'bg-heycontext-yellow text-black', 
      hex: '#FFDF39',
      usage: 'Primary accent, buttons, highlights'
    },
    { 
      name: 'Purple (Secondary)', 
      class: 'bg-heycontext-purple text-white', 
      hex: '#9046FF',
      usage: 'Secondary accent, creative elements'
    },
    { 
      name: 'Green (Success)', 
      class: 'bg-heycontext-green text-black', 
      hex: '#45E290',
      usage: 'Success states, positive actions'
    },
  ];

  // Semantic colors that adapt to theme
  const semanticColors = [
    { 
      name: 'Background', 
      class: 'bg-background text-foreground border border-border', 
      description: 'Main app background (#FFFFFF light, #202020 dark)'
    },
    { 
      name: 'Card', 
      class: 'bg-card text-card-foreground border border-border', 
      description: 'Card backgrounds and surfaces'
    },
    { 
      name: 'Primary', 
      class: 'bg-primary text-primary-foreground', 
      description: 'Primary actions (HeyContext Yellow)'
    },
    { 
      name: 'Secondary', 
      class: 'bg-secondary text-secondary-foreground', 
      description: 'Secondary backgrounds and surfaces'
    },
    { 
      name: 'Muted', 
      class: 'bg-muted text-muted-foreground', 
      description: 'Subtle backgrounds and disabled content'
    },
    { 
      name: 'Accent', 
      class: 'bg-accent text-accent-foreground', 
      description: 'Accent elements (HeyContext Yellow)'
    }
  ];

  const lightDarkColors = [
    { 
      name: 'Light Yellow', 
      class: 'bg-heycontext-light-yellow text-foreground', 
      description: 'Light tint for yellow backgrounds'
    },
    { 
      name: 'Light Purple', 
      class: 'bg-heycontext-light-purple text-foreground', 
      description: 'Light tint for purple backgrounds'
    },
    { 
      name: 'Light Green', 
      class: 'bg-heycontext-light-green text-foreground', 
      description: 'Light tint for green backgrounds'
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto bg-background text-foreground">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">HeyContext Design System</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive theming with #202020 dark mode and semantic color tokens
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Theme Requirements */}
      <div className="mb-8 p-6 border border-border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-4">Theme Requirements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-primary mb-2">Light Mode</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Background: Pure white (#FFFFFF)</li>
              <li>• Primary: HeyContext Yellow (#FFDF39)</li>
              <li>• Clean, bright aesthetics</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-primary mb-2">Dark Mode</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Background: Deep charcoal (#202020)</li>
              <li>• Never navy blue or gray-900</li>
              <li>• Yellow accent maintains contrast</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Brand Colors */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Brand Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {brandColors.map((color) => (
            <div key={color.name} className="rounded-lg overflow-hidden border border-border shadow-sm">
              <div className={`${color.class} h-24 flex items-end p-4`}>
                <div className="font-mono text-sm">{color.hex}</div>
              </div>
              <div className="p-4 bg-card">
                <h3 className="font-semibold text-card-foreground">{color.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{color.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Semantic Colors */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Semantic Colors</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          These colors automatically adapt to light/dark themes using CSS variables
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {semanticColors.map((color) => (
            <div key={color.name} className="rounded-lg overflow-hidden shadow-sm">
              <div className={`${color.class} h-16 flex items-center justify-center`}>
                <span className="font-medium">Sample Text</span>
              </div>
              <div className="p-3 bg-card border-t border-border">
                <h3 className="font-semibold text-sm text-card-foreground">{color.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{color.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Light Tints */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Light Tints</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {lightDarkColors.map((color) => (
            <div key={color.name} className="rounded-lg overflow-hidden border border-border shadow-sm">
              <div className={`${color.class} h-16 flex items-center justify-center`}>
                <span className="font-medium">Light Tint</span>
              </div>
              <div className="p-3 bg-card">
                <h3 className="font-semibold text-sm text-card-foreground">{color.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{color.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Examples */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Interactive Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-medium">Buttons</h3>
            <div className="space-y-2">
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
                Primary Button
              </button>
              <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors">
                Secondary Button
              </button>
              <button className="border border-border bg-background text-foreground px-4 py-2 rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                Outline Button
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-medium">Form Elements</h3>
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Text input" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground text-sm">Muted background container</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Guidelines */}
      <div className="p-6 border border-border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-4">Usage Guidelines</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-green-600 dark:text-green-400 mb-2">✓ Do</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Use semantic color tokens (bg-background, text-foreground)</li>
              <li>• Use HeyContext Yellow (#FFDF39) for primary actions</li>
              <li>• Ensure #202020 background in dark mode</li>
              <li>• Test in both light and dark themes</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">✗ Don't</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Use hardcoded colors like dark:bg-gray-800</li>
              <li>• Use navy blue backgrounds in dark mode</li>
              <li>• Mix hardcoded and semantic colors</li>
              <li>• Skip theme testing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 