# Living Projects System

A sophisticated project intelligence platform that transforms static project data into living, evolving systems through AI-powered fingerprinting and personalized dashboard experiences.

## 🏗️ System Architecture

### Core Philosophy

Living Projects treats each project as a unique entity with its own personality, preferences, and evolution trajectory. The system learns from user interactions to create increasingly personalized experiences over time.

### Key Components

#### 🎯 **Project Discovery & Fingerprinting**

- **ProjectDiscovery (modular)** *(in project-discovery/components)*: Orchestrated, modular conversation system that discovers project characteristics
- **AmbientFingerprintCanvas** *(in chat/components)*: Visual constellation mapping of discovered fingerprint fields
- **useProjectContext** *(in chat/hooks)*: Hook for managing project data and content integration

#### 🌌 **Unified Constellation View**

- **UnifiedConstellationView**: Main canvas for exploring project relationships and widget management
- **useStaticConstellationLayout**: Static positioning system for projects
- **useMultiLevelPanZoom**: Multi-level pan and zoom with view mode switching
- **useWidgetOrbitalLayout**: Orbital positioning for widgets around projects
- **ConnectionLines**: Visual connections between projects and widgets

#### 🧩 **Widget System**

- **CreateWidgetModal**: Widget creation interface with type selection
- **MultiLevelWidget**: Progressive disclosure widget rendering
- **ProjectOptionsModal**: Right-click context menu for project management
- **Widget Queries & Mutations**: Convex-based CRUD operations

#### 🎨 **UI Components**

- **ProjectSpaceBoundary**: Interactive project space boundaries
- **ConstellationControls**: Navigation and zoom controls
- **ConstellationMinimap**: Overview navigation with project clusters
- **CreateProjectModal**: Project creation interface

## 📁 Directory Structure

```
living-projects/
├── README.md                    # This file - System overview
├── page.tsx                     # Main constellation page
├── [projectId]/
│   ├── page.tsx                # Individual project view (uses UnifiedConstellationView)
│   └── README.md               # Project-specific documentation
├── components/
│   ├── UnifiedConstellationView.tsx  # Main constellation interface
│   ├── ConnectionLines.tsx           # Project relationship lines
│   ├── ConstellationControls.tsx     # Zoom and navigation controls
│   ├── ConstellationMinimap.tsx      # Overview navigation
│   ├── CreateProjectModal.tsx        # Project creation
│   ├── CreateWidgetModal.tsx         # Widget creation
│   ├── ProjectSpaceBoundary.tsx      # Project space boundaries
│   ├── ProjectOptionsModal.tsx       # Right-click context menu
│   ├── MultiLevelWidget.tsx          # Widget rendering
│   ├── LoadingState.tsx              # Loading UI
│   └── LivingProjectsScreen.tsx      # Main screen wrapper
├── hooks/
│   ├── useStaticConstellationLayout.ts  # Static project positioning
│   ├── useMultiLevelPanZoom.ts         # Multi-level pan/zoom
│   ├── useWidgetOrbitalLayout.ts       # Widget orbital positioning
│   └── useProjectStates.ts             # Project state management
└── README.md                    # This file
```

## 🚀 Key Features

### **Static Project Positioning**
- Projects maintain fixed positions once placed
- Non-overlapping positioning algorithm
- Automatic space radius calculation based on widget count

### **Unified Multi-Level View**
- Single component handles both project overview and widget detail
- 80% viewport threshold for automatic mode switching
- Smooth transitions between overview and project-detail modes

### **Widget Management**
- Real-time widget creation with orbital positioning
- Priority-based widget placement (higher priority = closer to center)
- Collision detection and smart positioning
- Right-click context menus for project management

### **Progressive Disclosure**
- Different detail levels based on zoom level
- Widget visibility: hidden → dot → summary → full
- Project visibility: dot → card → full space
- Smooth animations and transitions

## 🔧 Technical Implementation

### **Database Schema**
- **Projects**: Static positioning with `position_x`, `position_y`, `space_radius`
- **Widgets**: Orbital positioning with `orbital_angle`, `orbital_distance`
- **Convex Integration**: Real-time queries and mutations

### **Performance Optimizations**
- Viewport culling for efficient rendering
- Level of detail (LOD) system
- Smooth animations with requestAnimationFrame
- Memory-efficient state management

### **User Experience**
- Cursor-centric zoom behavior
- Intuitive right-click context menus
- Visual feedback and state indicators
- Responsive design for all screen sizes

## 📊 Usage Examples

### **Basic Constellation View**
```tsx
import { UnifiedConstellationView } from './components/UnifiedConstellationView'

export default function LivingProjectsPage() {
  return <UnifiedConstellationView />
}
```

### **Project-Specific View**
```tsx
import { UnifiedConstellationView } from './components/UnifiedConstellationView'

export default function ProjectPage({ projectId }) {
  return <UnifiedConstellationView initialProjectId={projectId} />
}
```

### **Widget Creation**
```tsx
import { CreateWidgetModal } from './components/CreateWidgetModal'

<CreateWidgetModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  projectId={projectId}
  projectName={projectName}
  onCreateWidget={handleCreateWidget}
/>
```

## 🎯 Development Status

- ✅ **Phase 1**: Static Project Positioning (Complete)
- ✅ **Phase 2**: Unified Multi-Level View (Complete)
- ✅ **Phase 3**: Real Widget Data Integration (Complete)
- ⏳ **Phase 4**: Performance Optimizations (Pending)

## 🔍 Troubleshooting

### **Common Issues**

1. **Projects not positioning correctly**: Check `useStaticConstellationLayout` dependencies
2. **Widgets not appearing**: Verify `useWidgetOrbitalLayout` calculations
3. **Zoom not working**: Check `useMultiLevelPanZoom` viewport calculations
4. **Right-click not working**: Ensure HTML overlay is properly positioned

### **Performance Issues**

1. **Slow rendering**: Check viewport culling implementation
2. **Memory leaks**: Verify proper cleanup in useEffect hooks
3. **Animation stuttering**: Check requestAnimationFrame usage

## 🚀 Future Enhancements

1. **Performance Optimizations**: Viewport culling, LOD system, memory management
2. **Advanced Widget Types**: More widget types and customization options
3. **Collaboration Features**: Real-time collaboration and sharing
4. **Analytics**: Project and widget usage analytics
5. **Mobile Optimization**: Touch gestures and mobile-specific features