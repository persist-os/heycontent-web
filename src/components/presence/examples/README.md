# Real-time Presence System

A comprehensive real-time collaborative presence system using Zustand for state management and Convex subscriptions for live updates.

## Features

- **Live Cursors**: See other users' cursor positions in real-time with colored indicators
- **Text Selections**: View other users' selected text with colored highlights
- **Typing Indicators**: Animated indicators showing when users are actively typing
- **User Avatars**: Color-coded avatars with status indicators (online, typing, idle)
- **Join/Leave Notifications**: Toast notifications when users join or leave
- **Automatic Cleanup**: Stale presence data is automatically cleaned up after 30 seconds
- **Heartbeat System**: Regular presence updates every 2-3 seconds
- **Scroll Awareness**: Track where users are looking in the document

## Quick Start

### 1. Basic Integration with Rich Text Editor

```tsx
import { PresenceEnabledNoteEditor } from '@/components/presence/examples/PresenceEnabledNoteEditor';

function MyNoteEditor() {
  const [content, setContent] = useState('');
  
  return (
    <PresenceEnabledNoteEditor
      noteId="note-123"
      content={content}
      onContentChange={setContent}
      showCollaboratorPanel={true}
      enablePresence={true}
    />
  );
}
```

### 2. Basic Integration with Lexical Editor

```tsx
import { PresenceEnabledLexicalEditor } from '@/components/presence/examples/PresenceEnabledLexicalEditor';

function MyLexicalEditor() {
  const [content, setContent] = useState('');
  
  return (
    <PresenceEnabledLexicalEditor
      noteId="note-123"
      content={content}
      onContentChange={setContent}
      showCollaboratorPanel={true}
      enablePresence={true}
    />
  );
}
```

### 3. Manual Integration with Custom Editor

```tsx
import { PresenceProvider, CollaboratorPanel } from '@/components/presence';
import { useAuth } from '@/hooks/useAuth';

function CustomEditor() {
  const { user } = useAuth();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState('');
  
  return (
    <div className="flex gap-4">
      <div className="flex-1 relative">
        <PresenceProvider
          noteId="note-123"
          userId={user.uid}
          userName={user.displayName}
          editorRef={editorRef}
          textContent={content}
          enabled={true}
          showNotifications={true}
        >
          <textarea
            ref={editorRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-4 border rounded"
          />
        </PresenceProvider>
      </div>
      
      <div className="w-80">
        <CollaboratorPanel />
      </div>
    </div>
  );
}
```

## Components

### PresenceProvider

Main wrapper component that enables presence functionality.

**Props:**
- `noteId: string` - Unique identifier for the document
- `userId: string` - Current user's ID
- `userName: string` - Current user's display name
- `editorRef: RefObject<HTMLElement>` - Reference to the editor element
- `textContent: string` - Current text content for cursor positioning
- `enabled?: boolean` - Enable/disable presence (default: true)
- `showNotifications?: boolean` - Show join/leave notifications (default: true)
- `showFloatingIndicator?: boolean` - Show floating collaborator indicator (default: false)
- `showCollaboratorPanel?: boolean` - Show full collaborator panel (default: false)

### CollaboratorPanel

Displays active collaborators with avatars and status.

**Props:**
- `className?: string` - Additional CSS classes
- `showInHeader?: boolean` - Compact header version (default: false)

### PresenceOverlay

Renders cursors, selections, and typing indicators over the editor.

**Props:**
- `editorRef: RefObject<HTMLElement>` - Reference to the editor element
- `textContent: string` - Current text content
- `className?: string` - Additional CSS classes

### FloatingCollaboratorIndicator

Floating indicator showing active user count and avatars.

**Props:**
- `className?: string` - Additional CSS classes

## Hooks

### usePresenceIntegration

Low-level hook for integrating presence with custom editors.

```tsx
const {
  updateCursorPosition,
  updateSelection,
  setTyping,
  handleCursorChange,
  handleTyping
} = usePresenceIntegration({
  noteId: 'note-123',
  userId: 'user-456',
  userName: 'John Doe',
  editorRef: myEditorRef,
  enabled: true
});
```

### usePresenceStore

Access the Zustand presence store directly.

```tsx
const {
  activeUsers,
  currentUser,
  getActiveUserCount,
  isUserActive,
  initializePresence,
  disconnect
} = usePresenceStore();
```

## Convex Backend

The system uses ephemeral Convex mutations and queries:

- `api.presence.updatePresence` - Update user presence
- `api.presence.removePresence` - Remove user when disconnecting
- `api.presence.getPresence` - Subscribe to presence updates
- `api.presence.getPresenceStats` - Get presence stats for multiple notes

## Styling

The system uses Tailwind CSS with custom color assignments. Each user gets a consistent color from a predefined palette:

```tsx
const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  // ... more colors
];
```

## Performance

- **Debounced Updates**: Cursor position updates are debounced to 100ms
- **Automatic Cleanup**: Stale presence data is cleaned up every 5 seconds
- **Efficient Rendering**: Only renders presence for other users, not current user
- **Memory Management**: In-memory storage with automatic cleanup

## Browser Support

- Modern browsers with WebSocket support
- Canvas API for text measurements
- ResizeObserver for responsive updates

## Troubleshooting

### Cursors not appearing
- Ensure `editorRef` points to the correct element
- Check that `textContent` is up to date
- Verify user authentication

### Performance issues
- Reduce heartbeat frequency if needed
- Increase debounce timeout for cursor updates
- Limit number of active users displayed

### Styling issues
- Ensure Tailwind CSS is properly configured
- Check z-index values for overlay positioning
- Verify color contrast for accessibility
