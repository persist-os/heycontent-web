# Living Projects Hooks

Specialized React hooks for managing project intelligence, layout algorithms, and interactive behaviors in the living projects system.

## 🎣 Available Hooks

### `useProjectContext` (in chat)

Manages project data fetching and content integration for discovery conversations.

```tsx
import { useProjectContext } from '../../chat/hooks/useProjectContext'

function ProjectDiscoveryChat({ projectId, userId }) {
  const { projectContext, isLoading, error, contentSummary } = useProjectContext(
    projectId,
    undefined, // fingerprintId
    userId
  )

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <ChatInterface
      context={projectContext}
      contentSummary={contentSummary}
    />
  )
}
```

**Returns:**

- `projectContext: ContentContext | null` - Formatted context for chat
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message if any
- `contentSummary: ProjectContentSummary | null` - Structured project data

**Features:**

- Fetches project details with attached notes and conversations
- Formats content for optimal AI context window usage
- Handles content truncation and prioritization
- Provides real-time loading states

### `useConstellationLayout`

Physics-based layout algorithm for positioning projects in constellation view.

```tsx
import { useConstellationLayout } from '../hooks/useConstellationLayout'

function ConstellationCanvas({ projects }) {
  const layout = useConstellationLayout(projects)

  return (
    <svg width={layout.canvasWidth} height={layout.canvasHeight}>
      {layout.positions.map(position => (
        <ProjectNode
          key={position.id}
          x={position.x}
          y={position.y}
          size={position.size}
          importance={position.importance}
        />
      ))}

      {layout.connections.map(connection => (
        <ConnectionLine
          key={`${connection.from}-${connection.to}`}
          from={connection.from}
          to={connection.to}
          strength={connection.strength}
        />
      ))}
    </svg>
  )
}
```

**Parameters:**

- `projects: Project[]` - Array of project objects with fingerprint data

**Returns:**

- `positions: ProjectPosition[]` - Positioned project nodes with coordinates
- `canvasWidth: number` - Calculated canvas dimensions
- `canvasHeight: number`
- `connections: Connection[]` - Relationship connections between projects

**Algorithm Features:**

- **Force-directed positioning** using spring physics
- **Importance-based clustering** - high-priority projects attract related ones
- **Collision avoidance** - prevents overlapping nodes
- **Responsive scaling** - adapts to different screen sizes
- **Performance optimized** - memoized calculations prevent unnecessary re-layout

### `usePanZoom`

Smooth pan and zoom functionality with gesture support for constellation navigation.

```tsx
import { usePanZoom } from '../hooks/usePanZoom'

function InteractiveCanvas({ canvasWidth, canvasHeight }) {
  const {
    transform,
    containerRef,
    handleWheel,
    handleMouseDown,
    zoomIn,
    zoomOut,
    resetView,
    focusOnPoint
  } = usePanZoom(canvasWidth, canvasHeight)

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      style={{
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
      }}
    >
      <CanvasContent />
    </div>
  )
}
```

**Parameters:**

- `canvasWidth: number` - Canvas width for bounds calculation
- `canvasHeight: number` - Canvas height for bounds calculation
- `viewportWidth?: number` - Viewport width (defaults to window.innerWidth)
- `viewportHeight?: number` - Viewport height (defaults to window.innerHeight)

**Returns:**

- `transform: PanZoomState` - Current { x, y, scale } transformation
- `containerRef: React.RefObject<HTMLDivElement>` - Container reference for event handling
- `handleWheel: (e: React.WheelEvent) => void` - Wheel event handler
- `handleMouseDown: (e: React.MouseEvent) => void` - Mouse event handler
- `zoomIn: () => void` - Zoom in function
- `zoomOut: () => void` - Zoom out function
- `resetView: () => void` - Reset to initial view
- `focusOnPoint: (x: number, y: number) => void` - Focus on specific point

**Features:**

- **Smooth animations** with momentum and easing
- **Multi-touch support** for mobile devices
- **Bounds checking** prevents panning outside canvas
- **Zoom constraints** with configurable min/max values
- **Keyboard shortcuts** for accessibility
- **Touch gesture recognition** for pinch-to-zoom

### `useProjectConnections`

Analyzes project relationships to create meaningful connections between related projects.

```tsx
import { useProjectConnections } from '../hooks/useProjectConnections'

function ProjectNetwork({ projects }) {
  const connections = useProjectConnections(projects)

  return (
    <div className="project-network">
      {connections.map(connection => (
        <div
          key={`${connection.from}-${connection.to}`}
          className="connection-line"
          style={{
            opacity: connection.strength,
            // Additional styling based on connection strength
          }}
        >
          {/* Connection visualization */}
        </div>
      ))}
    </div>
  )
}
```

**Parameters:**

- `projects: Project[]` - Array of projects to analyze relationships

**Returns:**

- `Connection[]` - Array of connection objects with strength and reasons

**Connection Analysis:**

- **Domain similarity** - Projects in same domain are connected
- **Collaboration style** - Projects with compatible team structures
- **Time horizon overlap** - Projects with similar timescales
- **Shared dependencies** - Projects requiring similar resources
- **Pattern compatibility** - Working style compatibility

## 🔧 Hook Architecture

### Design Principles

- **Single Responsibility** - Each hook handles one specific concern
- **Memoization** - Expensive calculations are cached appropriately
- **Error Handling** - Graceful degradation with meaningful error states
- **Type Safety** - Full TypeScript support with strict typing
- **Performance** - Optimized for large datasets and frequent updates

### State Management

- **Local State** - UI-specific state managed within hooks
- **Server State** - Convex queries for persistent data
- **Derived State** - Computed values based on props and server state
- **Shared State** - Zustand stores for cross-component communication

### Performance Optimizations

- **useMemo** for expensive calculations
- **useCallback** for event handlers
- **Debouncing** for rapid state changes
- **Virtual rendering** support for large datasets
- **Memory leak prevention** with proper cleanup

## 📊 Usage Patterns

### Basic Hook Composition

```tsx
function ProjectDashboard({ projectId }) {
  // Data fetching
  const { projectContext, isLoading } = useProjectContext(projectId) // from chat/hooks

  // Layout calculation
  const layout = useConstellationLayout([projectContext])

  // Interactive behavior
  const panZoom = usePanZoom(layout.canvasWidth, layout.canvasHeight)

  // Relationship analysis
  const connections = useProjectConnections([projectContext])

  if (isLoading) return <LoadingState />

  return (
    <InteractiveCanvas
      layout={layout}
      connections={connections}
      panZoom={panZoom}
    />
  )
}
```

### Advanced Hook Chaining

```tsx
function ComplexProjectView({ projectIds }) {
  // Fetch multiple projects
  const projectContexts = projectIds.map(id =>
    useProjectContext(id) // from chat/hooks
  )

  // Combine layouts
  const combinedLayout = useMemo(() => {
    const allProjects = projectContexts
      .filter(ctx => ctx.projectContext)
      .map(ctx => ctx.projectContext)

    return useConstellationLayout(allProjects)
  }, [projectContexts])

  // Cross-project connections
  const crossConnections = useProjectConnections(
    combinedLayout.positions
  )

  return <MultiProjectCanvas layout={combinedLayout} />
}
```

## 🧪 Testing

### Hook Testing Strategy

```tsx
import { renderHook } from '@testing-library/react'
import { useProjectContext } from '../chat/hooks/useProjectContext'

describe('useProjectContext', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() =>
      useProjectContext('project-id', undefined, 'user-id')
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.projectContext).toBe(null)
  })

  it('formats project content correctly', async () => {
    // Mock Convex query
    const mockProject = { /* project data */ }

    const { result } = renderHook(() =>
      useProjectContext('project-id', undefined, 'user-id')
    )

    // Wait for query to resolve
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.contentSummary).toBeDefined()
    expect(result.current.projectContext).toBeDefined()
  })
})
```

### Mock Data Strategy

```tsx
const mockProjectData = {
  _id: 'project-123',
  name: 'Test Project',
  description: 'A test project for development',
  attachedItems: {
    notes: [
      { title: 'Research Notes', content: 'Important findings...' }
    ],
    conversations: [
      { title: 'Planning Session', messages: [] }
    ]
  }
}
```

## 🔧 Development Guidelines

### Creating New Hooks

1. **Clear Purpose** - Define single responsibility clearly
2. **Type Safety** - Full TypeScript interfaces for inputs/outputs
3. **Error Handling** - Proper error states and user feedback
4. **Performance** - Memoization and cleanup where appropriate
5. **Testing** - Comprehensive test coverage including edge cases

### Hook Dependencies

- **React** - Core React hooks and utilities
- **Convex** - Database queries and mutations
- **Zustand** - Global state management
- **Custom utilities** - Project-specific helper functions

### Best Practices

- **Consistent Naming** - `use[Feature]` pattern
- **Documentation** - JSDoc comments with examples
- **Error Boundaries** - Graceful error handling
- **Accessibility** - Keyboard navigation support
- **Performance Monitoring** - Track hook performance in production
