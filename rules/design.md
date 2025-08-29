# Design & Styling Rules

This document outlines the visual and styling conventions for HeyContext, a private AI workspace. Adhering to these rules ensures a consistent, accessible, and calming user experience.

## Core Principles

- **Calm & Supportive**: Design that feels safe and non-judgmental
- **Human-Centered**: Accessible to everyone, regardless of technical background
- **Privacy-First**: Visual design reinforces personal, private workspace
- **Memory-Focused**: Design supports continuity and context across interactions
- **Minimalism**: Prioritize clarity and reduce cognitive load
- **Typography-First**: Use typography to create hierarchy and guide attention
- **Mobile-First**: Design for mobile screens first, then scale up
- **Accessibility**: Ensure all components work for users with different needs
- **Performance**: Optimize for smooth, responsive interactions
- **Never use loading screens, always use skeletons**: Use @skeleton.ts when possible

---

## Color System

Our theming is built on `next-themes` and TailwindCSS, utilizing CSS variables for dynamic color switching. The color palette supports a calm, personal workspace aesthetic.

### Semantic Colors

**NEVER use hardcoded colors.** Always use the semantic CSS variables provided. This is critical for theme consistency and the calming user experience.

| Class | CSS Variable | Light Mode (HSL) | Dark Mode (HSL) | Description |
|---|---|---|---|---|
| `bg-background` | `--background` | `0 0% 100%` | `0 0% 12.5%` (`#202020`) | Base page background |
| `text-foreground`| `--foreground` | `0 0% 3.9%` | `0 0% 98%` | Base text color |
| `bg-card` | `--card` | `0 0% 100%` | `0 0% 12.5%` | Card background |
| `text-card-...` | `--card-foreground`| `0 0% 3.9%` | `0 0% 98%` | Card text color |
| `bg-popover` | `--popover` | `0 0% 100%` | `0 0% 12.5%` | Popover background |
| `text-popover-...`| `--popover-foreground`| `0 0% 3.9%` | `0 0% 98%` | Popover text color |
| `bg-primary` | `--primary` | `55 95% 58%` | `55 95% 58%` | Primary accent (`#FFDF39`) |
| `text-primary-...`| `--primary-foreground`| `0 0% 0%` | `0 0% 0%` | Text on primary elements |
| `bg-secondary` | `--secondary` | `0 0% 96.1%` | `0 0% 18.9%` | Secondary background |
| `text-secondary-...`| `--secondary-foreground`| `0 0% 9%` | `0 0% 98%` | Text on secondary elements |
| `bg-muted` | `--muted` | `0 0% 96.1%` | `0 0% 16%` | Muted background |
| `text-muted-...` | `--muted-foreground`| `0 0% 45.1%` | `0 0% 63.9%` | Muted text color |
| `bg-accent` | `--accent` | `264 100% 64%` | `55 95% 58%` | Accent color: purple in light mode, yellow in dark mode |
| `text-accent-...` | `--accent-foreground`| `0 0% 0%` | `0 0% 0%` | Text on accent elements |
| `bg-destructive` | `--destructive` | `0 84.2% 60.2%`| `0 62.8% 30.6%` | Destructive/error color |
| `border` | `--border` | `0 0% 89.8%` | `0 0% 20%` | Component borders |
| `input` | `--input` | `0 0% 89.8%` | `0 0% 20%` | Input borders |
| `ring` | `--ring` | `55 95% 58%` | `55 95% 58%` | Focus rings (`#FFDF39`) |

### Custom Brand Colors

Use these for specific elements that reinforce the personal workspace aesthetic.

| Name | Class (`bg-heycontext-*`) | Hex |
|---|---|---|
| Yellow | `yellow` | `#FFDF39` |
| Purple | `purple` | `#9046FF` |
| Green | `green` | `#45E290` |
| Light Yellow | `light-yellow` | `hsl(55 100% 92%)` |
| Light Purple | `light-purple` | `hsl(280 100% 95%)` |
| Light Green | `light-green` | `hsl(140 60% 95%)` |

---

## Typography

- **Default Fonts**: System fonts for main UI to prioritize performance and native feel
- **Chat Interface**: Use `.chat-font` class for "Söhne" font stack for conversational warmth
- **Tone**: All text should feel supportive and accessible, never intimidating or technical

### Text Hierarchy

- **Headers**: Clear hierarchy that guides understanding without overwhelming
- **Body Text**: Comfortable reading size and line height for extended use
- **Interface Text**: Clear labels that anyone can understand

---

## Sizing and Spacing

- **Base Unit**: Use `rem` for consistent spacing across devices
- **Container**: Use `container` class for centered, max-width content layouts (max-width: `1400px` on `2xl` screens)
- **Border Radius**: Controlled by `--radius` CSS variable
  - `--radius`: `0.5rem`
  - `rounded-lg`: `var(--radius)`
  - `rounded-md`: `calc(var(--radius) - 2px)`
  - `rounded-sm`: `calc(var(--radius) - 4px)`

### Spacing Philosophy

- **Generous Whitespace**: Allow content to breathe and reduce cognitive load
- **Consistent Patterns**: Predictable spacing that users can rely on
- **Mobile Comfort**: Touch-friendly spacing on mobile devices

---

## Animations

Animations should feel calm and supportive, never jarring or attention-seeking.

| Class (`animate-*`) | Keyframes | Description |
|---|---|---|
| `accordion-down` | `accordion-down` | Gentle slide down for expanding content |
| `accordion-up` | `accordion-up` | Gentle slide up for collapsing content |
| `bounce-delay-*` | `bounce-delay-*` | Subtle bouncing with staggered delays |
| `pulse-slow` | `pulse-slow` | Gentle, slow pulsing for loading states |
| `shine` | `shine` | Subtle shimmer effect for interactive elements |
| `fade-in` | `fade-in` | Smooth fade-in for new content |
| `float` / `float-subtle` | `float` | Gentle floating animation for accent elements |

### Animation Principles

- **Subtle Over Flashy**: Animations should support understanding, not distract
- **Calm Timing**: Use slower, more natural timing curves
- **Purposeful**: Every animation should serve a functional purpose

---

## Custom Utilities

- `.line-clamp-[2|3|4]`: Truncates text to specific number of lines for clean layouts
- `.hide-scrollbar`: Hides scrollbars for cleaner appearance
- `.custom-scrollbar`: Applies minimal, unobtrusive scrollbar styling
- `.text-wrap-balance`: Prevents awkward single words on final lines

---

## Component Guidelines

### Theme Toggle

The theme toggle reinforces user control and personal preference:

- **Modes**: Must support Light, Dark, and System settings
- **Accessibility**: Proper `aria-label` attributes for all users
- **Hydration**: Handle client-side hydration to avoid theme flicker
- **Visual Feedback**: Clear indication of current theme state

### Interactive Elements

- **Touch-Friendly**: Minimum 44px touch targets on mobile
- **Clear States**: Obvious hover, focus, and active states
- **Consistent Behavior**: Predictable interaction patterns throughout

### Content Areas

- **Breathing Room**: Generous padding and margins for comfortable reading
- **Logical Grouping**: Visual hierarchy that supports understanding
- **Scannable Layout**: Easy to quickly understand and navigate

---

## Privacy-First Visual Design

### No Social Elements

- No profile pictures or avatars in main interface
- No sharing buttons or social indicators
- No public activity feeds or timelines
- No follower counts or social metrics

### Personal Workspace Metaphors

- Use notebook, journal, and workspace visual metaphors
- Emphasize personal organization over public performance
- Design elements that feel private and contained
- Avoid business or productivity tool aesthetics

### Supportive Visual Language

- Warm, approachable colors over corporate schemes
- Gentle curves and soft edges over sharp, aggressive lines
- Comfortable spacing that invites extended use
- Visual cues that reinforce safety and privacy

---

## Accessibility Requirements

### Universal Design

- **Color Independence**: Information never conveyed by color alone
- **Contrast Compliance**: Meet or exceed WCAG AA standards
- **Keyboard Navigation**: All interactive elements keyboard accessible
- **Screen Reader Support**: Proper semantic markup and ARIA labels

### Language Accessibility

- **Plain Language**: Avoid jargon, technical terms, or business speak
- **Clear Instructions**: Simple, direct guidance for all interactions
- **Error Messages**: Helpful, non-technical error explanations
- **Consistent Terminology**: Same words for same concepts throughout

---

## Summary

HeyContext's design should feel like a calm, private space that anyone can use comfortably. Every visual decision should support the core values of privacy, accessibility, and human-centered design. The interface should feel more like a trusted friend's notebook than a corporate productivity tool.