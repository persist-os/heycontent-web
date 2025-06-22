# Design & Styling Rules

This document outlines the visual and styling conventions for the HeyContent frontend. Adhering to these rules ensures a consistent, accessible, and on-brand user experience.

## Core Principles

- **Minimalism**: Prioritize whitespace, clarity, and a strong visual hierarchy.
- **Typography-First**: Use typography to define structure and guide the user's attention.
- **Mobile-First**: Design and build for mobile screens first, then scale up to larger viewports.
- **Accessibility**: Ensure all components are accessible and follow best practices.
- **Performance**: Optimize for fast, smooth animations and transitions.
- **Consistency**: Maintain a consistent visual language across the app.
- **Branding**: Ensure all components are on-brand and reflect the HeyContent identity.
- **Responsiveness**: Design for a wide range of screen sizes and devices.
- **Performance**: Optimize for fast, smooth animations and transitions.*
- **Never use loading screens, always use skeletons.**: Ensure that all components use skeletons instead of loading screens. Use @skeleton.ts when possible.

---

## Color System

Our theming is built on `next-themes` and TailwindCSS, utilizing CSS variables for dynamic color switching.

### Semantic Colors

**NEVER use hardcoded colors.** Always use the semantic CSS variables provided. This is critical for theme consistency and future updates.

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

Use these for specific, branded elements that don't fit the semantic model.

| Name | Class (`bg-heycontent-*`) | Hex |
|---|---|---|
| Yellow | `yellow` | `#FFDF39` |
| Purple | `purple` | `#9046FF` |
| Green | `green` | `#45E290` |
| Light Yellow | `light-yellow` | `hsl(55 100% 92%)` |
| Light Purple | `light-purple` | `hsl(280 100% 95%)` |
| Light Green | `light-green` | `hsl(140 60% 95%)` |

---

## Typography

- **Default Fonts**: The project uses system fonts for the main UI to prioritize performance and a native feel.
- **Chat Interface**: For the chat UI, use the `.chat-font` class to apply the "Söhne" font stack for a more polished, conversational feel.

---

## Sizing and Spacing

- **Base Unit**: The base unit for spacing and sizing is `rem`.
- **Container**: Use the `container` class for centered, max-width content layouts. It applies padding and has a max-width of `1400px` on `2xl` screens.
- **Border Radius**: The border radius is controlled by the `--radius` CSS variable.
  - `--radius`: `0.5rem`
  - `rounded-lg`: `var(--radius)`
  - `rounded-md`: `calc(var(--radius) - 2px)`
  - `rounded-sm`: `calc(var(--radius) - 4px)`

---

## Animations

The following animations are available as Tailwind utility classes.

| Class (`animate-*`) | Keyframes | Description |
|---|---|---|
| `accordion-down` | `accordion-down` | Slides content down from a height of 0. |
| `accordion-up` | `accordion-up` | Slides content up to a height of 0. |
| `bounce-delay-*` | `bounce-delay-*` | A bouncing animation with staggered delays. |
| `pulse-slow` | `pulse-slow` | A slow, subtle pulsing animation. |
| `shine` | `shine` | A shimmering shine effect that moves across an element. |
| `fade-in` | `fade-in` | Fades an element in. |
| `float` / `float-subtle` | `float` | A gentle floating animation. |

---

## Custom Utilities

- `.line-clamp-[2|3|4]`: Truncates text to a specific number of lines.
- `.hide-scrollbar`: Hides the scrollbar for an element.
- `.custom-scrollbar`: Applies custom, minimal scrollbar styling.
- `.text-wrap-balance`: Prevents single "orphan" words on the last line of a text block.

### Theme Toggle

The theme toggle component must:
- Support Light, Dark, and System modes.
- Use appropriate accessibility labels (`aria-label`).
- Handle client-side hydration correctly to avoid theme flicker, typically by showing a loading state or placeholder.

---

## Components

### Theme Toggle

The theme toggle component is a critical piece of the UI and must adhere to the following rules:

- **Modes**: Must support Light, Dark, and System settings.
- **Accessibility**: Must use proper `aria-label` attributes for screen readers.
- **Hydration**: Must handle client-side hydration correctly to avoid theme "flicker" on page load. This is typically done by showing a loading state or a placeholder icon until the theme is determined. 