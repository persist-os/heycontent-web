# Living Projects Hooks

This directory contains all the custom React hooks for the Living Projects constellation system.

## 🏗️ Hook Architecture

### **Core Hooks**

#### `useStaticConstellationLayout.ts`
Generates constellation layout using stored static positions of projects.

**Features:**
- Uses database-stored project positions
- Calculates canvas bounds automatically
- No force-directed layout calculations
- Efficient for large numbers of projects

**Usage:**
```tsx
import { useStaticConstellationLayout } from '../hooks/useStaticConstellationLayout'

const layout = useStaticConstellationLayout(projects)
// Returns: { positions, connections, canvasWidth, canvasHeight }
```

#### `useMultiLevelPanZoom.ts`
Handles multi-level pan and zoom with automatic view mode switching.

**Features:**
- Cursor-centric zoom behavior
- Smooth animations with easing
- Automatic view mode switching (overview ↔ project-detail)
- 80% viewport threshold for project focus
- Progressive disclosure thresholds

**Usage:**
```tsx
import { useMultiLevelPanZoom } from '../hooks/useMultiLevelPanZoom'

const {
  containerRef,
  transform,
  viewMode,
  focusedProjectId,
  handleWheel,
  handleMouseDown,
  zoomIn,
  zoomOut,
  resetView,
  focusOnProject
} = useMultiLevelPanZoom({
  canvasWidth,
  canvasHeight,
  viewportWidth,
  viewportHeight,
  onViewModeChange,
  onProjectFocus
})
```

#### `useWidgetOrbitalLayout.ts`
Calculates orbital positions for widgets around a project center.

**Features:**
- Uses stored orbital angles and distances
- Maintains positions across zoom sessions
- Efficient positioning algorithm
- Supports different widget sizes

**Usage:**
```tsx
import { useWidgetOrbitalLayout } from '../hooks/useWidgetOrbitalLayout'

const widgetLayout = useWidgetOrbitalLayout(
  projectX,
  projectY,
  widgets
)
// Returns: { positions, spaceRadius }
```

#### `useProjectStates.ts`
Manages project states and provides styling helpers.

**Features:**
- Calculates project states (new, active, complete)
- Provides visual styling based on state
- Efficient state calculations
- Consistent state management

**Usage:**
```tsx
import { useProjectStates } from '../hooks/useProjectStates'

const projectStates = useProjectStates(projects)
const stateStyles = getProjectStateStyles(projectState)
```

## 🎯 Hook Dependencies

### **Data Dependencies**
- **Projects**: Array of project objects with positioning data
- **Widgets**: Array of widget objects with orbital positioning
- **Viewport**: Current viewport dimensions and transform

### **External Dependencies**
- **React**: useState, useCallback, useEffect, useMemo
- **Convex**: useQuery, useMutation for real-time data
- **Next.js**: useRouter for navigation

## 🔧 Hook Patterns

### **State Management Pattern**
```tsx
const [state, setState] = useState(initialState)
const [isLoading, setIsLoading] = useState(false)

const handleAction = useCallback(async (data) => {
  setIsLoading(true)
  try {
    await mutation(data)
    // Handle success
  } catch (error) {
    // Handle error
  } finally {
    setIsLoading(false)
  }
}, [mutation])
```

### **Layout Calculation Pattern**
```tsx
const layout = useMemo(() => {
  if (!data) return defaultLayout
  
  return calculateLayout(data)
}, [data, dependencies])
```

### **Event Handling Pattern**
```tsx
const handleEvent = useCallback((event) => {
  event.preventDefault()
  // Handle event
}, [dependencies])

useEffect(() => {
  element.addEventListener('event', handleEvent)
  return () => element.removeEventListener('event', handleEvent)
}, [handleEvent])
```

## 🚀 Performance Optimizations

### **Memoization**
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers
- Avoid unnecessary re-renders

### **Dependency Arrays**
- Include all dependencies in useEffect/useMemo/useCallback
- Use stable references when possible
- Avoid object/array dependencies that change on every render

### **Cleanup**
- Clean up event listeners in useEffect
- Cancel animations on unmount
- Clear timeouts and intervals

## 🔍 Testing Hooks

### **Custom Hook Testing**
```tsx
import { renderHook, act } from '@testing-library/react'
import { useStaticConstellationLayout } from './useStaticConstellationLayout'

describe('useStaticConstellationLayout', () => {
  it('calculates layout correctly', () => {
    const { result } = renderHook(() => 
      useStaticConstellationLayout(mockProjects)
    )
    
    expect(result.current.positions).toHaveLength(mockProjects.length)
    expect(result.current.canvasWidth).toBeGreaterThan(0)
  })
})
```

### **Integration Testing**
```tsx
import { render, screen } from '@testing-library/react'
import { UnifiedConstellationView } from '../components/UnifiedConstellationView'

describe('Hook Integration', () => {
  it('renders with all hooks working', () => {
    render(<UnifiedConstellationView />)
    // Test that all hooks work together
  })
})
```

## 📚 Related Files

- `../components/` - Components that use these hooks
- `../../convex/` - Database queries and mutations
- `../../../types/projectWidgets.ts` - TypeScript interfaces

## 🎯 Development Guidelines

### **Adding New Hooks**

1. Follow the existing naming conventions
2. Use TypeScript for all interfaces
3. Include proper error handling
4. Add comprehensive JSDoc comments
5. Write tests for all hook functionality

### **Hook Documentation**

```tsx
/**
 * Calculates orbital positions for widgets around a project center
 * @param projectX - X coordinate of project center
 * @param projectY - Y coordinate of project center
 * @param widgets - Array of widget objects
 * @returns Object with positions and space radius
 */
export function useWidgetOrbitalLayout(
  projectX: number,
  projectY: number,
  widgets: WidgetConfig[]
): OrbitalLayoutResult {
  // Implementation
}
```

### **Performance Monitoring**

- Use React DevTools Profiler
- Monitor hook execution time
- Check for unnecessary re-renders
- Test with large datasets