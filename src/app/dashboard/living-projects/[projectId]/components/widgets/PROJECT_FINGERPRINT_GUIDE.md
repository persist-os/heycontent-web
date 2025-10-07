# Project Fingerprint Display - Usage Guide

## Overview

The **ProjectFingerprint** component displays a project's unique DNA in a beautiful, anti-corporate design. It appears in the top-left of the constellation canvas and can be expanded to show detailed project characteristics.

## Location

- **Component**: `ProjectFingerprint.tsx`
- **Integrated in**: `ConstellationCanvas.tsx` (line 211-213)
- **Position**: Top-left corner of the constellation view

## Design Principles Applied

✅ **Typography as primary visual language** - Uses font weights and sizes for hierarchy  
✅ **Asymmetric balance** - Staggered grids and offset layouts  
✅ **Subtle visual cues** - Gradient status lines, gentle borders  
✅ **Meaningful microinteractions** - 1.02x scale on hover, 300ms transitions  
✅ **Content-first layouts** - Generous spacing, breathing room  

## How to Edit

### 1. Change Position

In `ConstellationCanvas.tsx`, line 211:

```tsx
// Current: Top-left
<div className="absolute top-6 left-6 z-10 pointer-events-auto max-w-2xl">

// Move to top-right:
<div className="absolute top-6 right-6 z-10 pointer-events-auto max-w-2xl">

// Move to bottom-left:
<div className="absolute bottom-6 left-6 z-10 pointer-events-auto max-w-2xl">
```

### 2. Customize Collapsed State

In `ProjectFingerprint.tsx`, lines 79-109:

```tsx
// Change button styling:
className="... px-6 py-3 ..."  // Adjust padding
className="... rounded-lg ..."  // Change border radius

// Modify metrics shown:
<div className="flex items-center gap-4 text-xs text-muted-foreground/60">
  <div className="flex items-center gap-2">
    <div className="h-1 w-1 rounded-full bg-current" />
    <span>{metrics.completion}% formed</span>  // Edit this
  </div>
  // Add more metrics here
</div>
```

### 3. Add New Sections to Expanded View

In `ProjectFingerprint.tsx`, add a new section in the content grid (after line 210):

```tsx
{/* Your New Section */}
{fingerprint.your_field_name && (
  <div className="space-y-3">
    <h3 className="text-sm font-medium text-muted-foreground/80">Section Title</h3>
    <div className="bg-muted/20 border-l-2 border-emerald-400/60 pl-4 py-3 space-y-2">
      <div className="text-base font-light">{fingerprint.your_field_name}</div>
      <div className="text-xs text-muted-foreground/70">
        Additional info here
      </div>
    </div>
  </div>
)}
```

### 4. Customize Status Colors

In `ProjectFingerprint.tsx`, lines 54-69:

```tsx
const getStatusGradient = (status: string) => {
  switch (status) {
    case 'active':
      return 'from-transparent via-blue-400/60 to-transparent'
    // Add new status:
    case 'paused':
      return 'from-transparent via-gray-400/60 to-transparent'
    // Or change existing colors:
    case 'discovering':
      return 'from-transparent via-pink-400/60 to-transparent'
    // ...
  }
}
```

### 5. Change Grid Layout

**Modify the characteristics grid** (lines 146-192):

```tsx
// Current: 3 columns on large screens
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Change to 2 columns:
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

// Change to 4 columns:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// Add more stagger (see line 162):
<div className="space-y-3 md:mt-4">  // Change md:mt-4 to md:mt-8 for more offset
```

### 6. Modify Typography Scale

**Header sizes** (line 131):
```tsx
<h2 className="text-4xl font-light tracking-tight">  // Change to text-3xl or text-5xl
```

**Section headers** (line 149):
```tsx
<h3 className="text-sm font-medium text-muted-foreground/80">  // Adjust size
```

**Body text** (line 156):
```tsx
<div className="text-base font-light">  // Change to text-sm or text-lg
```

### 7. Adjust Spacing

**Component padding** (line 127):
```tsx
<div className="p-8 space-y-8">  // Change p-8 to p-6 or p-10
```

**Section gaps** (line 146):
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">  // Adjust gap-6
```

### 8. Modify Animations

**Hover scale** (line 82):
```tsx
className="... hover:scale-[1.02] ..."  // Change to 1.03 or 1.01
```

**Transition duration** (line 82):
```tsx
className="... transition-all duration-300 ..."  // Change to duration-200 or duration-500
```

## Available Fingerprint Fields

All fields from the fingerprint schema can be displayed:

### Core Identity
- `name`, `description`, `projectId`, `userId`

### Project Nature
- `domain` (academic, creative, business, etc.)
- `complexity_level` (1-10)
- `collaboration_style` (solo, small_team, etc.)
- `time_horizon` (sprint, project, journey, etc.)

### Working Pattern
- `primary_pattern` (iterative_creator, systematic_builder, etc.)
- `working_style` (array)
- `decision_making`, `energy_patterns`

### Intentions
- `core_intention`, `success_vision`
- `value_creation`, `personal_growth`

### Timeline
- `natural_rhythm` (daily, weekly, monthly, etc.)
- `key_phases`, `flexibility_preference`

### Interface Preferences
- `cognitive_load_preference`, `information_density`
- `motivation_style`, `feedback_frequency`
- `learning_sensitivity` (1-10)

### Metadata
- `status`, `created_at`, `last_evolution`
- `intelligence_version`

## Color Palette (Anti-Corporate)

Status colors use subtle, low-opacity gradients:
- **Blue** (`blue-400/60`): Active, primary actions
- **Amber** (`amber-400/60`): Discovering, in progress
- **Purple** (`purple-400/60`): Evolving, transforming
- **Green** (`green-400/60`): Completing, success
- **Muted** (`muted-foreground/30`): Archived, inactive

Border accent colors for sections:
- **Blue** (`border-blue-400/60`): Nature, intentions
- **Purple** (`border-purple-400/60`): Patterns, working style
- **Amber** (`border-amber-400/60`): Rhythm, timeline
- **Green** (`border-green-400/60`): Success, completion

## Common Customizations

### Make it more compact:
1. Reduce padding: `p-8` → `p-4`
2. Reduce gaps: `gap-6` → `gap-4`
3. Reduce font sizes: `text-4xl` → `text-3xl`, `text-base` → `text-sm`

### Make it more spacious:
1. Increase padding: `p-8` → `p-12`
2. Increase gaps: `gap-6` → `gap-8`
3. Increase font sizes: `text-4xl` → `text-5xl`

### Hide specific sections:
Wrap any section in a conditional:
```tsx
{false && (  // Set to true to show, false to hide
  <div className="space-y-4">
    {/* Section content */}
  </div>
)}
```

### Change default state:
Line 40:
```tsx
const [isExpanded, setIsExpanded] = useState(false)  // Change to true for default expanded
```

## Integration Notes

- **Query Dependencies**: Uses two Convex queries:
  - `getByProject` - Full fingerprint data
  - `getCompletionStatus` - Completion percentage
  
- **Performance**: Queries are reactive and automatically update when fingerprint changes

- **Responsive**: Designed mobile-first with breakpoints at `md:` and `lg:`

- **Accessibility**: Uses semantic HTML and proper button elements

## Anti-Corporate Guidelines Met

✅ No icons used - pure typography  
✅ Subtle color usage - only for status indication  
✅ Asymmetric layouts - staggered grids, offset sections  
✅ Generous white space - breathing room everywhere  
✅ Soft interactions - gentle hover effects  
✅ Content-first - information hierarchy through typography  
✅ No heavy shadows - subtle borders and gradients only  
✅ Natural transitions - 300ms with proper easing  

## Questions?

The component is fully self-contained and easy to modify. All styling uses Tailwind classes for quick adjustments. Experiment with the values to find what works best for your design vision.
