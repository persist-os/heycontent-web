# Living Projects Components

This directory contains all the React components for the Living Projects constellation system.

## 🏗️ Component Architecture

### **Core Components**

#### `UnifiedConstellationView.tsx`
The main component that handles both project overview and widget detail views. Replaces the old `ConstellationView` and `ProjectViewScreen` components.

**Features:**
- Multi-level view switching (overview ↔ project-detail)
- Real-time widget data integration
- Project space boundary management
- Right-click context menus
- Widget creation and management

**Usage:**
```tsx
import { UnifiedConstellationView } from './UnifiedConstellationView'

// Basic usage
<UnifiedConstellationView />

// With initial project focus
<UnifiedConstellationView initialProjectId="project-123" />
```

#### `ProjectSpaceBoundary.tsx`
Renders interactive circular boundaries around projects with hover effects and click handling.

**Features:**
- Progressive disclosure based on zoom level
- Right-click context menu support
- Project state visualization
- Hover effects and animations

#### `MultiLevelWidget.tsx`
Renders widgets with different levels of detail based on zoom level and distance.

**Features:**
- Progressive disclosure: hidden → dot → summary → full
- Smooth animations and transitions
- Interactive hover states
- Responsive sizing

### **Modal Components**

#### `CreateProjectModal.tsx`
Modal for creating new projects with form validation and error handling.

#### `CreateWidgetModal.tsx`
Modal for creating new widgets within projects with type selection and configuration.

#### `ProjectOptionsModal.tsx`
Right-click context menu for project management (delete, view details, etc.).

### **UI Components**

#### `ConnectionLines.tsx`
Renders connection lines between projects and widgets with viewport culling.

#### `ConstellationControls.tsx`
Zoom and navigation controls with smooth animations.

#### `ConstellationMinimap.tsx`
Overview navigation showing project clusters and current viewport.

#### `LoadingState.tsx`
Loading UI component with consistent styling.

### **Screen Components**

#### `LivingProjectsScreen.tsx`
Main screen wrapper that renders the `UnifiedConstellationView`.

## 🎯 Component Relationships

```
LivingProjectsScreen
└── UnifiedConstellationView
    ├── ProjectSpaceBoundary (for each project)
    ├── MultiLevelWidget (for each widget)
    ├── ConnectionLines
    ├── ConstellationControls
    ├── ConstellationMinimap
    ├── CreateProjectModal
    ├── CreateWidgetModal
    └── ProjectOptionsModal
```

## 🔧 Props and Interfaces

### **UnifiedConstellationView Props**
```tsx
interface UnifiedConstellationViewProps {
  initialProjectId?: string  // Optional project to focus on
}
```

### **ProjectSpaceBoundary Props**
```tsx
interface ProjectSpaceBoundaryProps {
  x: number
  y: number
  radius: number
  scale: number
  isHighlighted: boolean
  isFocused: boolean
  viewMode: 'overview' | 'project-detail'
  projectName: string
  projectState: ProjectState
  projectId: string
  onClick: () => void
  onHover?: (isHovered: boolean) => void
  onRightClick?: (projectId: string, projectName: string, event: React.MouseEvent) => void
  ZOOM_THRESHOLD_PROJECT_DOTS: number
  ZOOM_THRESHOLD_PROJECT_CARDS: number
}
```

### **MultiLevelWidget Props**
```tsx
interface MultiLevelWidgetProps {
  widget: WidgetConfig
  x: number
  y: number
  scale: number
  viewMode: 'overview' | 'project-detail'
  zoomLevel: 'hidden' | 'dot' | 'summary' | 'full'
  onClick: () => void
  onHover?: (isHovered: boolean) => void
}
```

## 🎨 Styling and Theming

All components use Tailwind CSS with CSS variables for theming:

```css
:root {
  --primary: 210 40% 50%;
  --muted: 210 40% 20%;
  --background: 210 40% 5%;
  --foreground: 210 40% 95%;
}
```

## 🚀 Performance Considerations

- **Viewport Culling**: Only render visible elements
- **Level of Detail**: Different detail levels based on zoom
- **Smooth Animations**: Use requestAnimationFrame for animations
- **Memory Management**: Proper cleanup in useEffect hooks

## 🔍 Development Guidelines

### **Adding New Components**

1. Follow the existing naming conventions
2. Use TypeScript interfaces for props
3. Include proper error handling
4. Add hover states and animations
5. Ensure accessibility compliance

### **Component Testing**

```tsx
import { render, screen } from '@testing-library/react'
import { UnifiedConstellationView } from './UnifiedConstellationView'

describe('UnifiedConstellationView', () => {
  it('renders without crashing', () => {
    render(<UnifiedConstellationView />)
    expect(screen.getByText('Constellation')).toBeInTheDocument()
  })
})
```

### **Performance Monitoring**

- Use React DevTools Profiler
- Monitor re-renders and unnecessary updates
- Check memory usage with large datasets
- Test with 100+ projects and 1000+ widgets

## 📚 Related Files

- `../hooks/` - Custom hooks for state management
- `../../convex/` - Database queries and mutations
- `../../../types/projectWidgets.ts` - TypeScript interfaces