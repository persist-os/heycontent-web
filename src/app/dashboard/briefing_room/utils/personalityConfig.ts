/**
 * Briefing Room - Personality Configuration
 * 
 * Defines visual personality for each briefer category.
 * Each type has distinct typography, colors, and animation style.
 */

import { BrieferCategory, BrieferPersonality } from "../types";

// ============================================================================
// Category Personalities
// ============================================================================

/**
 * Crystal Briefer - Ethereal, light, mysterious
 * 
 * Visual language: Floating, transparent, soft glow
 * Typography: Light, spacious, elegant
 * Movement: Slow breathing, gentle drift
 */
export const CRYSTAL_PERSONALITY: BrieferPersonality = {
  category: "crystal",
  typographyStyle: {
    headerClass: "text-6xl font-light tracking-tighter leading-[0.9]",
    subheaderClass: "text-2xl font-light tracking-wide leading-relaxed",
    bodyClass: "text-base font-light tracking-normal leading-relaxed",
  },
  colorTheme: {
    primary: "blue-600/90",
    secondary: "blue-500/60",
    accent: "blue-400/80",
  },
  animationStyle: {
    breathingDuration: 4000,
    breathingScale: 1.02,
    entranceDelay: 0,
  },
};

/**
 * Widget Briefer - Efficient, warm, helpful
 * 
 * Visual language: Clean, organized, purposeful
 * Typography: Medium weight, balanced spacing
 * Movement: Steady breathing, confident arrival
 */
export const WIDGET_PERSONALITY: BrieferPersonality = {
  category: "widget",
  typographyStyle: {
    headerClass: "text-4xl font-medium tracking-tight leading-tight",
    subheaderClass: "text-xl font-normal tracking-normal leading-relaxed",
    bodyClass: "text-base font-normal tracking-normal leading-normal",
  },
  colorTheme: {
    primary: "amber-700",
    secondary: "amber-600/80",
    accent: "amber-500",
  },
  animationStyle: {
    breathingDuration: 3000,
    breathingScale: 1.015,
    entranceDelay: 0,
  },
};

/**
 * Dream Briefer - Flowing, poetic, mysterious
 * 
 * Visual language: Soft edges, ethereal, dreamlike
 * Typography: Light italic, generous spacing
 * Movement: Slow, flowing, mysterious
 */
export const DREAM_PERSONALITY: BrieferPersonality = {
  category: "dream",
  typographyStyle: {
    headerClass: "text-5xl font-light italic tracking-wider leading-relaxed",
    subheaderClass: "text-2xl font-light not-italic tracking-wide leading-loose",
    bodyClass: "text-base font-light tracking-normal leading-loose",
  },
  colorTheme: {
    primary: "purple-600/80",
    secondary: "purple-500/60",
    accent: "purple-400",
  },
  animationStyle: {
    breathingDuration: 5000,
    breathingScale: 1.03,
    entranceDelay: 200,
  },
};

/**
 * Collaboration Briefer - Social, warm, inviting
 * 
 * Visual language: Friendly, approachable, human
 * Typography: Medium weight, comfortable spacing
 * Movement: Natural, responsive, warm
 */
export const COLLABORATION_PERSONALITY: BrieferPersonality = {
  category: "collaboration",
  typographyStyle: {
    headerClass: "text-4xl font-medium tracking-tight leading-snug",
    subheaderClass: "text-xl font-normal tracking-normal leading-relaxed",
    bodyClass: "text-base font-normal tracking-normal leading-relaxed",
  },
  colorTheme: {
    primary: "green-700",
    secondary: "green-600/80",
    accent: "green-500",
  },
  animationStyle: {
    breathingDuration: 3500,
    breathingScale: 1.02,
    entranceDelay: 0,
  },
};

/**
 * System Briefer - Clean, technical, precise
 * 
 * Visual language: Sharp, clear, efficient
 * Typography: Medium weight, tight spacing
 * Movement: Minimal, precise, no-nonsense
 */
export const SYSTEM_PERSONALITY: BrieferPersonality = {
  category: "system",
  typographyStyle: {
    headerClass: "text-3xl font-medium tracking-tight leading-tight",
    subheaderClass: "text-lg font-normal tracking-normal leading-snug",
    bodyClass: "text-sm font-normal tracking-normal leading-normal",
  },
  colorTheme: {
    primary: "slate-700",
    secondary: "slate-600/80",
    accent: "slate-500",
  },
  animationStyle: {
    breathingDuration: 0, // No breathing animation
    breathingScale: 1,
    entranceDelay: 0,
  },
};

// ============================================================================
// Personality Lookup
// ============================================================================

/**
 * Get personality configuration for a category
 */
export function getPersonality(category: BrieferCategory): BrieferPersonality {
  const personalities: Record<BrieferCategory, BrieferPersonality> = {
    crystal: CRYSTAL_PERSONALITY,
    widget: WIDGET_PERSONALITY,
    dream: DREAM_PERSONALITY,
    collaboration: COLLABORATION_PERSONALITY,
    system: SYSTEM_PERSONALITY,
  };
  
  return personalities[category];
}

// ============================================================================
// Dynamic Style Helpers
// ============================================================================

/**
 * Get Tailwind classes for header
 */
export function getHeaderClasses(category: BrieferCategory): string {
  const personality = getPersonality(category);
  return `${personality.typographyStyle.headerClass} text-${personality.colorTheme.primary}`;
}

/**
 * Get Tailwind classes for subheader
 */
export function getSubheaderClasses(category: BrieferCategory): string {
  const personality = getPersonality(category);
  return `${personality.typographyStyle.subheaderClass} text-${personality.colorTheme.secondary}`;
}

/**
 * Get Tailwind classes for body
 */
export function getBodyClasses(category: BrieferCategory): string {
  const personality = getPersonality(category);
  return `${personality.typographyStyle.bodyClass} text-${personality.colorTheme.primary}`;
}

/**
 * Get accent color for category
 */
export function getAccentColor(category: BrieferCategory): string {
  const personality = getPersonality(category);
  return personality.colorTheme.accent;
}

/**
 * Get breathing animation config
 */
export function getBreathingConfig(category: BrieferCategory): {
  duration: number;
  scale: number;
} {
  const personality = getPersonality(category);
  return {
    duration: personality.animationStyle.breathingDuration,
    scale: personality.animationStyle.breathingScale,
  };
}

/**
 * Get entrance delay
 */
export function getEntranceDelay(category: BrieferCategory): number {
  const personality = getPersonality(category);
  return personality.animationStyle.entranceDelay;
}

// ============================================================================
// Gradient Helpers
// ============================================================================

/**
 * Get gradient classes for category
 */
export function getGradientClasses(category: BrieferCategory): string {
  const colorMap: Record<BrieferCategory, string> = {
    crystal: "from-blue-400/20 via-blue-500/10 to-blue-600/20",
    widget: "from-amber-400/20 via-amber-500/10 to-amber-600/20",
    dream: "from-purple-400/20 via-purple-500/10 to-purple-600/20",
    collaboration: "from-green-400/20 via-green-500/10 to-green-600/20",
    system: "from-slate-400/20 via-slate-500/10 to-slate-600/20",
  };
  
  return `bg-gradient-to-br ${colorMap[category]}`;
}

/**
 * Get border gradient classes
 */
export function getBorderGradientClasses(category: BrieferCategory): string {
  const colorMap: Record<BrieferCategory, string> = {
    crystal: "from-transparent via-blue-400/60 to-transparent",
    widget: "from-transparent via-amber-400/60 to-transparent",
    dream: "from-transparent via-purple-400/60 to-transparent",
    collaboration: "from-transparent via-green-400/60 to-transparent",
    system: "from-transparent via-slate-400/60 to-transparent",
  };
  
  return `bg-gradient-to-r ${colorMap[category]}`;
}

// ============================================================================
// Animation Keyframes
// ============================================================================

/**
 * Get breathing animation keyframes
 */
export function getBreathingKeyframes(
  category: BrieferCategory
): string {
  const config = getBreathingConfig(category);
  
  if (config.duration === 0) return "";
  
  return `
    @keyframes breathe-${category} {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(${config.scale});
      }
    }
  `;
}

/**
 * Get entrance animation keyframes
 */
export function getEntranceKeyframes(
  category: BrieferCategory
): { from: string; to: string } {
  const entranceMap: Record<BrieferCategory, { from: string; to: string }> = {
    crystal: {
      from: "opacity: 0; transform: translateY(-50px) rotate(-5deg);",
      to: "opacity: 1; transform: translateY(0) rotate(0deg);",
    },
    widget: {
      from: "opacity: 0; transform: translateX(100px);",
      to: "opacity: 1; transform: translateX(0);",
    },
    dream: {
      from: "opacity: 0; transform: scale(0.8) rotate(3deg);",
      to: "opacity: 1; transform: scale(1) rotate(0deg);",
    },
    collaboration: {
      from: "opacity: 0; transform: translateY(50px);",
      to: "opacity: 1; transform: translateY(0);",
    },
    system: {
      from: "opacity: 0;",
      to: "opacity: 1;",
    },
  };
  
  return entranceMap[category];
}

// ============================================================================
// Export All Personalities
// ============================================================================

export const PERSONALITIES: Record<BrieferCategory, BrieferPersonality> = {
  crystal: CRYSTAL_PERSONALITY,
  widget: WIDGET_PERSONALITY,
  dream: DREAM_PERSONALITY,
  collaboration: COLLABORATION_PERSONALITY,
  system: SYSTEM_PERSONALITY,
};

