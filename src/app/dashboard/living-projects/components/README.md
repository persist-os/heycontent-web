# Living Projects Components

React components for the living projects system, providing interactive interfaces for project discovery, constellation visualization, and personalized dashboards.

## 🧩 Component Overview

### Core Components

#### `ConstellationView`

Main canvas component for exploring project relationships and connections.

```tsx
import { ConstellationView } from './ConstellationView'

function LivingProjectsPage() {
  return (
    <div className="min-h-screen">
      <ConstellationView />
    </div>
  )
}
```

**Features:**

- **Interactive Canvas** - Pan, zoom, and navigate project constellation
- **Project Stars** - Visual nodes representing each project
- **Connection Lines** - Animated relationships between projects
- **Minimap** - Overview navigation with viewport indicator
- **Controls** - Zoom and reset functionality

**Props:**

- None - Uses global auth and query state

#### `ProjectDiscoveryChat` *(in chat/components)*

Interactive conversation interface for discovering project characteristics.

```tsx
import { ProjectDiscoveryChat } from '../chat/components/ProjectDiscoveryChat'

function ProjectSetup({ projectId, fingerprintId }) {
  return (
    <ProjectDiscoveryChat
      projectId={projectId}
      fingerprintId={fingerprintId}
    />
  )
}
```

**Features:**

- **AI Conversation** - Natural language project discovery
- **Context Integration** - Pulls in existing project content
- **Fingerprint Visualization** - Ambient constellation canvas
- **Real-time Updates** - Live fingerprint field discovery
- **Transition Handling** - Smooth progression to project reveal

**Props:**

- `projectId?: string` - Current project ID
- `fingerprintId?: string` - Existing fingerprint ID

#### `AmbientFingerprintCanvas` *(in chat/components)*

Visual constellation representation of discovered project characteristics.

```tsx
import { AmbientFingerprintCanvas } from '../chat/components/AmbientFingerprintCanvas'

function DiscoveryInterface({ messageCount, isActive }) {
  return (
    <AmbientFingerprintCanvas
      messageCount={messageCount}
      isActive={isActive}
      onAllStarsDiscovered={() => handleCompletion()}
    />
  )
}
```

**Features:**

- **Progressive Discovery** - Stars appear as fingerprint fields are discovered
- **Interactive Tooltips** - Hover information for each constellation node
- **Phase Messaging** - Contextual messages based on discovery progress
- **Completion Animation** - Special effects when all fields are discovered
- **Responsive Design** - Adapts to different screen sizes

**Props:**

- `messageCount: number` - Number of messages in conversation
- `isActive: boolean` - Whether the canvas should be active
- `onAllStarsDiscovered?: () => void` - Callback when all stars discovered

### Project Management Components

#### `CreateProjectModal`

Modal dialog for creating new projects with initial context.

```tsx
import { CreateProjectModal } from './CreateProjectModal'

function ProjectCreation({ isOpen, onClose, onCreateProject }) {
  return (
    <CreateProjectModal
      isOpen={isOpen}
      onClose={onClose}
      onCreateProject={onCreateProject}
    />
  )
}
```

**Features:**

- **Asymmetric Design** - Unique visual layout with gradients
- **Progressive Disclosure** - Context revealed as user types
- **Validation** - Real-time input validation and character counts
- **Discovery Teaser** - Preview of the discovery process

#### `ProjectCard`

Individual project representation in grid/list views.

```tsx
import { ProjectCard } from './ProjectCard'

function ProjectGrid({ projects }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(project => (
        <ProjectCard
          key={project._id}
          project={project}
          onClick={() => navigateToProject(project._id)}
        />
      ))}
    </div>
  )
}
```

**Features:**

- **Status Indicators** - Visual project state (discovering, active, living)
- **Smart Previews** - Truncated descriptions with read-more logic
- **Action States** - Different CTAs based on project maturity
- **Hover Effects** - Subtle animations and state changes

### UI Components

#### `ConstellationControls`

Navigation controls for the constellation canvas.

```tsx
import { ConstellationControls } from './ConstellationControls'

function CanvasInterface({ scale, onZoomIn, onZoomOut, onReset }) {
  return (
    <ConstellationControls
      scale={scale}
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
      onReset={onReset}
    />
  )
}
```

**Features:**

- **Zoom Controls** - In/out buttons with scale display
- **Reset View** - Return to initial constellation state
- **Instructions** - Contextual help based on zoom level
- **Responsive Design** - Adapts to different control layouts

#### `ConstellationMinimap`

Overview navigation with project clustering.

```tsx
import { ConstellationMinimap } from './ConstellationMinimap'

function NavigationInterface({ positions, currentTransform, onViewportClick }) {
  return (
    <ConstellationMinimap
      positions={positions}
      canvasWidth={1000}
      canvasHeight={800}
      viewportWidth={window.innerWidth}
      viewportHeight={window.innerHeight}
      currentTransform={currentTransform}
      onViewportClick={onViewportClick}
    />
  )
}
```

**Features:**

- **Project Clusters** - Visual grouping by importance/relationships
- **Viewport Indicator** - Current view bounds on minimap
- **Click Navigation** - Jump to different areas of constellation
- **Legend** - Color coding explanation
- **Performance Optimized** - Efficient rendering for large datasets

### Connection Components

#### `ConnectionLines`

Animated relationship lines between projects in constellation view.

```tsx
import { ConnectionLines } from './ConnectionLines'

function ProjectConnections({
  connections,
  positions,
  transform,
  highlightedProject
}) {
  return (
    <ConnectionLines
      connections={connections}
      positions={positions}
      canvasWidth={2000}
      canvasHeight={1500}
      scale={transform.scale}
      translateX={transform.x}
      translateY={transform.y}
      highlightedProject={highlightedProject}
      viewportWidth={1200}
      viewportHeight={800}
    />
  )
}
```

**Features:**

- **Curved Connections** - Organic relationship lines
- **Strength-based Styling** - Opacity and width based on relationship strength
- **Highlight Effects** - Enhanced visibility for related projects
- **Performance Culling** - Only render visible connections
- **Animated Gradients** - Smooth flowing energy effects

#### `ProjectStar`

Interactive project node in constellation view.

```tsx
import { ProjectStar } from './ProjectStar'

function ProjectNode({ project, position, isHighlighted, scale, onClick }) {
  return (
    <ProjectStar
      project={project}
      x={position.x}
      y={position.y}
      size={position.size}
      importance={position.importance}
      isHighlighted={isHighlighted}
      scale={scale}
      onClick={onClick}
      onHover={setHighlightedProject}
    />
  )
}
```

**Features:**

- **Adaptive Detail** - Content density based on zoom level
- **Importance Indicators** - Visual weight based on project significance
- **Status Visualization** - Color coding for project state
- **Hover Interactions** - Smooth transitions and highlights
- **Performance Optimized** - Efficient rendering at all zoom levels

## 🎨 Design System

### Theme Architecture

```tsx
// Personality-driven theming
const themes = {
  creative: {
    primary: 'orange',
    gradient: 'from-orange-50/30 via-yellow-50/20 to-red-50/10',
    icon: Heart
  },
  academic: {
    primary: 'slate',
    gradient: 'from-slate-50/30 via-gray-50/20 to-emerald-50/10',
    icon: BookOpen
  },
  business: {
    primary: 'blue',
    gradient: 'from-blue-50/30 via-indigo-50/20 to-cyan-50/10',
    icon: Target
  }
}
```

### Responsive Breakpoints

- **Mobile**: Single column, stacked layout
- **Tablet**: Two-column grid, compressed navigation
- **Desktop**: Multi-column, full feature set
- **Large**: Expanded canvas, detailed views

### Animation Principles

- **Micro-interactions** - Subtle feedback for user actions
- **State transitions** - Smooth changes between different views
- **Loading states** - Skeleton screens and progressive disclosure
- **Performance** - GPU-accelerated animations where possible

## 🔧 Component Architecture

### State Management

```tsx
// Local state for UI interactions
const [activeTab, setActiveTab] = useState('overview')
const [highlightedProject, setHighlightedProject] = useState(null)

// Server state via Convex
const projects = useQuery(api.projectsQueries.getProjectsForUser, { userId })

// Global state via Zustand
const { context, setContext } = useContentContext()
```

### Error Handling

```tsx
// Graceful error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <ProjectComponent />
</ErrorBoundary>

// User-friendly error states
if (error) {
  return (
    <div className="error-state">
      <ErrorIcon />
      <p>{error.message}</p>
      <Button onClick={retry}>Try Again</Button>
    </div>
  )
}
```

### Performance Optimization

```tsx
// Virtual rendering for large lists
import { FixedSizeList as List } from 'react-window'

function VirtualizedProjectList({ projects }) {
  return (
    <List
      height={400}
      itemCount={projects.length}
      itemSize={100}
    >
      {({ index, style }) => (
        <div style={style}>
          <ProjectCard project={projects[index]} />
        </div>
      )}
    </List>
  )
}
```

## 🧪 Component Testing

### Testing Strategy

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ConstellationView } from './ConstellationView'

describe('ConstellationView', () => {
  it('renders project stars for each project', () => {
    const mockProjects = [
      { _id: '1', name: 'Project A', fingerprintId: 'fp1' },
      { _id: '2', name: 'Project B', fingerprintId: 'fp2' }
    ]

    render(<ConstellationView />)

    expect(screen.getByText('Project A')).toBeInTheDocument()
    expect(screen.getByText('Project B')).toBeInTheDocument()
  })

  it('handles project click navigation', () => {
    const mockRouter = { push: jest.fn() }
    // Mock router context

    render(<ConstellationView />)

    const projectStar = screen.getByText('Project A')
    fireEvent.click(projectStar)

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/living-projects/1')
  })
})
```

### Mock Data

```tsx
const mockProject = {
  _id: 'project-123',
  name: 'Creative Portfolio',
  description: 'Building stunning portfolio website',
  fingerprintId: 'fp-456',
  createdAt: Date.now() - 86400000, // 1 day ago
  updatedAt: Date.now() - 3600000 // 1 hour ago
}

const mockFingerprint = {
  projectId: 'project-123',
  domain: 'creative',
  complexity_level: 7,
  primary_pattern: 'iterative_creator',
  // ... other fingerprint fields
}
```

## 📱 Mobile Optimization

### Touch Gestures

- **Pinch to zoom** - Multi-touch zoom controls
- **Pan with momentum** - Smooth scrolling with deceleration
- **Tap to select** - Project selection without hover states
- **Swipe navigation** - Quick movement between project views

### Responsive Layout

```tsx
// Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {projects.map(project => (
    <ProjectCard
      key={project._id}
      project={project}
      className="w-full"
    />
  ))}
</div>
```

## ♿ Accessibility

### Keyboard Navigation

- **Tab order** - Logical navigation through interactive elements
- **Keyboard shortcuts** - Quick actions (zoom, reset, navigation)
- **Focus management** - Clear focus indicators and states
- **Screen reader support** - Proper ARIA labels and descriptions

### Visual Accessibility

- **Color contrast** - WCAG compliant color ratios
- **Focus indicators** - Visible focus rings and states
- **Motion preferences** - Respects user's motion preferences
- **High contrast mode** - Support for system high contrast themes

## 🔧 Development Guidelines

### Component Creation

1. **Single Responsibility** - Each component has one clear purpose
2. **Props Interface** - Well-defined TypeScript interfaces
3. **Default Props** - Sensible defaults for optional props
4. **Error Boundaries** - Graceful error handling
5. **Performance** - Memoization and optimization where needed

### Naming Conventions

```tsx
// Component files
ProjectCard.tsx
ConstellationView.tsx
ProjectDiscoveryChat.tsx

// Component names
export function ProjectCard() { /* ... */ }
export function ConstellationView() { /* ... */ }

// Hook names
export function useProjectContext() { /* ... */ }
```

### File Organization

```
components/
├── index.ts              # Component exports
├── ConstellationView.tsx # Main constellation
├── ProjectDiscoveryChat.tsx # Discovery interface
├── AmbientFingerprintCanvas.tsx # Visual canvas
├── ConnectionLines.tsx   # Relationship lines
├── ProjectStar.tsx       # Project nodes
├── ConstellationControls.tsx # Navigation controls
├── ConstellationMinimap.tsx # Overview map
├── CreateProjectModal.tsx # Creation modal
├── LoadingState.tsx      # Loading UI
└── widgets/              # Widget components
```

### Code Style

- **Functional components** with hooks
- **TypeScript strict mode** enabled
- **Consistent naming** and formatting
- **JSDoc comments** for complex logic
- **Error handling** with user-friendly messages
