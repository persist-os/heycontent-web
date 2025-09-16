# Constellation System Implementation Guide

## 🎯 Overview

This document provides a comprehensive guide to the Constellation System implementation, covering all the features, components, views, and interactions we've built during our 4-phase refactor.

## 🏗️ System Architecture

### **Core Philosophy**
The Constellation System treats projects as celestial bodies in a universe, with widgets orbiting around them like satellites. The system provides a unified, multi-level view that seamlessly transitions between overview and detail modes.

### **Key Design Principles**
- **Static Positioning**: Projects maintain fixed positions once placed
- **Unified Multi-Level View**: Single component handles both overview and detail
- **Progressive Disclosure**: Content appears/disappears based on zoom level
- **Smooth Transitions**: All interactions use smooth animations
- **Cursor-Centric Zoom**: Zoom always centers on cursor position

## 📱 Pages & Views

### **1. Main Constellation Page**
**Path**: `/dashboard/living-projects`
**Component**: `LivingProjectsScreen` → `UnifiedConstellationView`

**Features**:
- Overview of all projects in constellation format
- 20% default zoom for maximum visibility
- Project spaces visible on hover
- Click project spaces to focus/zoom in
- Right-click for project options (delete, view details)

### **2. Project Detail Page**
**Path**: `/dashboard/living-projects/[projectId]`
**Component**: `UnifiedConstellationView` with `initialProjectId`

**Features**:
- Automatically focuses on specific project
- Shows project space with widgets in orbital positions
- Widget creation and management
- Project-specific actions and controls

## 🎮 View Modes & Zoom System

### **View Modes**

#### **Overview Mode** (Default)
- **Trigger**: Zoom level < 80% viewport threshold
- **Features**:
  - All projects visible as titles with dots
  - Project space boundaries appear on hover
  - No widgets visible
  - Minimap shows project clusters
  - "New Project" button available

#### **Project Detail Mode**
- **Trigger**: Zoom level ≥ 80% viewport threshold OR manual focus
- **Features**:
  - Focused project space always visible
  - Widgets visible in orbital positions
  - Project-to-widget connection lines
  - "New Widget" button available
  - Project-specific controls

### **Zoom Levels & Progressive Disclosure**

#### **Zoom Thresholds**
```typescript
const ZOOM_THRESHOLD_PROJECT_DOTS = 0.3      // < 30%: Projects as simple dots
const ZOOM_THRESHOLD_PROJECT_CARDS = 0.5     // 30-50%: Projects as cards with boundaries
const ZOOM_THRESHOLD_WIDGET_VISIBILITY = 0.7 // 50-70%: Widget dots appear
const ZOOM_THRESHOLD_WIDGET_DETAIL = 1.2     // 70-120%: Full widget cards
const ZOOM_THRESHOLD_PROJECT_FOCUS = 0.8     // 80%: Auto-focus on project
```

#### **Progressive Disclosure Levels**

**Projects**:
- **< 30%**: Simple dots with project titles
- **30-50%**: Project cards with visible boundaries
- **50%+**: Full project spaces with hover effects

**Widgets**:
- **< 70%**: Hidden
- **70-120%**: Dots in orbital positions
- **120%+**: Full widget cards with details

## 🧩 Core Components

### **UnifiedConstellationView**
**Purpose**: Main component that handles both overview and project detail views

**Key Features**:
- Multi-level view switching
- Real-time widget data integration
- Project space boundary management
- Right-click context menus
- Widget creation and management
- Smooth animations and transitions

**Props**:
```typescript
interface UnifiedConstellationViewProps {
  initialProjectId?: string  // Optional project to focus on
}
```

### **ProjectSpaceBoundary**
**Purpose**: Renders interactive circular boundaries around projects

**Features**:
- Progressive disclosure based on zoom level
- Right-click context menu support
- Project state visualization (new, active, complete)
- Hover effects and animations
- HTML overlay for proper event handling

**Visual States**:
- **Overview**: Boundaries visible only on hover
- **Project Detail**: Boundaries always visible
- **Focused**: Enhanced styling with pulse animation

### **MultiLevelWidget**
**Purpose**: Renders widgets with different levels of detail

**Progressive Disclosure**:
- **Hidden**: Not rendered (zoom < 70%)
- **Dot**: Simple circular indicator
- **Summary**: Basic widget information
- **Full**: Complete widget with all details

### **CreateWidgetModal**
**Purpose**: Modal for creating new widgets within projects

**Features**:
- Widget type selection (10 different types)
- Priority slider (1-10 scale)
- Size and theme selection
- Form validation and error handling
- Automatic orbital positioning

**Widget Types Available**:
- Content Calendar, Analytics Dashboard, Task Manager
- Research Tracker, Milestone Timeline, Collaboration Board
- Resource Library, Mood Tracker, Time Tracker, Inspiration Board

### **ProjectOptionsModal**
**Purpose**: Right-click context menu for project management

**Options**:
- View Details (navigate to project page)
- Delete Project (with confirmation)
- Future: Project Settings, Share, etc.

## 🔧 Hooks & State Management

### **useMultiLevelPanZoom**
**Purpose**: Handles multi-level pan and zoom with view mode switching

**Key Features**:
- Cursor-centric zoom behavior
- Smooth animations with easing
- Automatic view mode switching
- 80% viewport threshold for project focus
- Progressive disclosure thresholds

**Methods**:
- `zoomIn()`: Zoom in with smooth animation
- `zoomOut()`: Zoom out with smooth animation
- `resetView()`: Center canvas at 20% zoom
- `focusOnProject()`: Focus on specific project
- `focusOnPoint()`: Focus on specific coordinates

### **useStaticConstellationLayout**
**Purpose**: Generates constellation layout using stored static positions

**Features**:
- Uses database-stored project positions
- Calculates canvas bounds automatically
- No force-directed layout calculations
- Efficient for large numbers of projects

### **useWidgetOrbitalLayout**
**Purpose**: Calculates orbital positions for widgets around projects

**Features**:
- Uses stored orbital angles and distances
- Maintains positions across zoom sessions
- Efficient positioning algorithm
- Supports different widget sizes

### **useProjectStates**
**Purpose**: Manages project states and provides styling helpers

**States**:
- **New**: Created within last 24 hours
- **Active**: Modified within last week
- **Complete**: Has fingerprint ID (completed)

## 🗄️ Database Schema

### **Projects Table**
```typescript
projects: defineTable({
  // Core fields
  userId: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  
  // Static positioning (NEW)
  position_x: v.number(),      // Required - no optional
  position_y: v.number(),      // Required - no optional  
  space_radius: v.number(),    // Calculated based on widget count
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

### **Widgets Table**
```typescript
widgets: defineTable({
  // Core identification
  widget_id: v.string(),
  project_id: v.id("projects"),
  user_id: v.string(),
  
  // Widget configuration
  widget_type: v.string(),
  title: v.string(),
  description: v.string(),
  priority: v.number(),        // 1-10, determines orbit distance
  size: v.string(),            // small, medium, large
  theme: v.string(),
  config: v.any(),
  
  // Orbital positioning (NEW)
  orbital_angle: v.number(),   // 0 to 2π
  orbital_distance: v.number(), // Distance from project center
  
  // Timestamps
  created_at: v.number(),
  updated_at: v.number(),
})
.index("by_project", ["project_id"])
.index("by_user", ["user_id"])
```

## 🔄 Convex Integration

### **Widget Queries**
- `getWidgetsByProject`: Fetch widgets for specific project
- `getWidgetsByUser`: Fetch all user's widgets
- `getWidgetById`: Get specific widget
- `getWidgetsWithProjects`: Get widgets with project info

### **Widget Mutations**
- `createWidget`: Create new widget with orbital positioning
- `updateWidget`: Update existing widget
- `deleteWidget`: Delete widget and update project space
- `recalculateWidgetPositions`: Recalculate all widget positions

### **Project Mutations**
- `createProject`: Create project with static positioning
- `deleteProject`: Delete project and associated data

## 🎨 User Interactions

### **Mouse Interactions**

#### **Left Click**
- **Overview**: Click project space to focus/zoom in
- **Project Detail**: Click project space to maintain focus
- **Widgets**: Click widget for details (future feature)

#### **Right Click**
- **Project Spaces**: Open project options modal
- **Background**: Prevent browser context menu

#### **Hover**
- **Project Spaces**: Show boundaries and highlight
- **Widgets**: Show hover effects and details

### **Keyboard Shortcuts**
- **Scroll**: Zoom in/out (cursor-centric)
- **Drag**: Pan around canvas
- **Reset Button**: Center view at 20% zoom

### **Touch Gestures** (Future)
- **Pinch**: Zoom in/out
- **Two-finger drag**: Pan
- **Tap**: Select/focus

## 🚀 Performance Features

### **Viewport Culling**
- Only render elements within viewport bounds
- Efficient rendering for large datasets
- Smooth performance with 100+ projects

### **Level of Detail (LOD)**
- Different detail levels based on zoom
- Automatic switching between LOD levels
- Smooth transitions between levels

### **Smooth Animations**
- All interactions use `requestAnimationFrame`
- Easing functions for natural feel
- Consistent animation durations

## 🎯 Navigation Flow

### **Overview → Project Detail**
1. User clicks on project space
2. System calculates zoom level to fit project in 80% viewport
3. Smooth animation to project center
4. View mode switches to "project-detail"
5. Widgets become visible in orbital positions

### **Project Detail → Overview**
1. User clicks "Reset" button
2. Smooth animation to canvas center at 20% zoom
3. View mode switches to "overview"
4. Widgets become hidden
5. URL clears project-specific parameters

### **Project Creation**
1. User clicks "New Project" button
2. Modal opens with project creation form
3. System generates non-overlapping position
4. Project appears in constellation
5. User can immediately interact with new project

### **Widget Creation**
1. User focuses on project (project-detail mode)
2. User clicks "New Widget" button
3. Modal opens with widget creation form
4. System calculates orbital position
5. Widget appears in orbital position around project

## 🔍 Debugging & Troubleshooting

### **Common Issues**

#### **Projects Not Positioning Correctly**
- Check `useStaticConstellationLayout` dependencies
- Verify project data includes `position_x`, `position_y`, `space_radius`
- Check canvas bounds calculation

#### **Widgets Not Appearing**
- Verify `useWidgetOrbitalLayout` calculations
- Check widget data includes `orbital_angle`, `orbital_distance`
- Ensure project is in focus (project-detail mode)

#### **Zoom Not Working**
- Check `useMultiLevelPanZoom` viewport calculations
- Verify transform state updates
- Check animation system is not blocked

#### **Right-Click Not Working**
- Ensure HTML overlay is properly positioned
- Check event handlers are attached correctly
- Verify `preventDefault()` is called

### **Performance Issues**

#### **Slow Rendering**
- Check viewport culling implementation
- Verify LOD system is working
- Monitor re-render frequency

#### **Memory Leaks**
- Check proper cleanup in useEffect hooks
- Verify event listeners are removed
- Monitor memory usage with DevTools

#### **Animation Stuttering**
- Check `requestAnimationFrame` usage
- Verify animation timing
- Check for conflicting animations

## 🎨 Styling & Theming

### **CSS Variables**
```css
:root {
  --primary: 210 40% 50%;
  --muted: 210 40% 20%;
  --background: 210 40% 5%;
  --foreground: 210 40% 95%;
}
```

### **Component Styling**
- All components use Tailwind CSS
- Consistent spacing and typography
- Dark theme optimized
- Responsive design patterns

### **Animation Classes**
- Smooth transitions for all interactions
- Hover effects with consistent timing
- Loading states with proper feedback
- Error states with clear messaging

## 📊 Future Enhancements

### **Phase 4: Performance Optimizations**
- Advanced viewport culling
- Widget virtualization
- Memory management improvements
- Animation performance optimization

### **Additional Features**
- Widget-to-widget connections
- Advanced widget types
- Collaboration features
- Mobile touch gestures
- Analytics and insights

### **User Experience**
- Keyboard navigation
- Accessibility improvements
- Custom themes
- Advanced customization options

## 🧪 Testing

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

### **Hook Testing**
```tsx
import { renderHook } from '@testing-library/react'
import { useStaticConstellationLayout } from './useStaticConstellationLayout'

describe('useStaticConstellationLayout', () => {
  it('calculates layout correctly', () => {
    const { result } = renderHook(() => 
      useStaticConstellationLayout(mockProjects)
    )
    
    expect(result.current.positions).toHaveLength(mockProjects.length)
  })
})
```

### **Integration Testing**
- Test complete user flows
- Test view mode transitions
- Test widget creation and management
- Test project creation and deletion

## 📚 Related Documentation

- `README.md` - System overview and architecture
- `components/README.md` - Component documentation
- `hooks/README.md` - Hook documentation
- `convex/` - Database schema and functions

---

This implementation guide provides a comprehensive overview of the Constellation System. For specific implementation details, refer to the individual component and hook documentation.
