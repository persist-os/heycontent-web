# Operational Transform Engine

This implementation provides real-time collaborative text editing using Operational Transform (OT) with Convex as the backend.

## Features

- **Real-time Collaboration**: Multiple users can edit the same document simultaneously
- **Conflict Resolution**: Automatic transformation of conflicting operations
- **Persistent Operations**: All operations are stored in Convex for reliability
- **Snapshot System**: Periodic snapshots for faster document loading
- **Vector Clocks**: Proper ordering of concurrent operations
- **Client-side Prediction**: Immediate local updates with server reconciliation
- **Automatic Reconnection**: Handles network interruptions gracefully

## Architecture

### Server-side (Convex)

1. **Schema Tables**:
   - `text_operations`: Stores individual text operations with sequence numbers
   - `note_snapshots`: Periodic full-text snapshots for performance
   - `operation_acknowledgments`: Tracks operation delivery to clients

2. **Core Functions**:
   - `submitOperation`: Handles incoming operations and conflict resolution
   - `getOperationsSince`: Retrieves operations for real-time sync
   - `getDocumentState`: Returns current document state and collaborators

3. **Operational Transform Logic**:
   - Transform functions for Insert, Delete, and Retain operations
   - Vector clock management for ordering
   - Automatic snapshot creation

### Client-side

1. **OT Client**: Manages local state and server synchronization
2. **React Hooks**: Easy integration with React components
3. **Lexical Integration**: Collaborative editor built on Lexical framework
4. **Real-time Sync**: Convex subscriptions for live updates

## Usage

### Basic Collaborative Editor

```tsx
import { CollaborativeNotepadEditor } from '@/components/ui/lexical-editor/CollaborativeNotepadEditor';
import { Id } from '@/convex/_generated/dataModel';

function MyEditor({ noteId, userId }: { noteId: Id<"notes">, userId: string }) {
  const [content, setContent] = useState("");
  
  return (
    <CollaborativeNotepadEditor
      noteId={noteId}
      content={content}
      onContentChange={setContent}
      userId={userId}
      enableCollaborationByDefault={true}
      showCollaborationToggle={true}
      onCollaborationToggle={(enabled) => {
        console.log('Collaboration:', enabled ? 'enabled' : 'disabled');
      }}
    />
  );
}
```

### Using the Collaborative Editor Hook

```tsx
import { useCollaborativeEditor } from '@/lib/operationalTransform/useCollaborativeEditor';

function MyComponent({ noteId, userId }: { noteId: Id<"notes">, userId: string }) {
  const [editorState, editorActions] = useCollaborativeEditor(noteId, userId, {
    autoConnect: true,
    onError: (error) => console.error('Collaboration error:', error),
  });
  
  return (
    <div>
      <div>Status: {editorState.isConnected ? 'Connected' : 'Disconnected'}</div>
      <div>Collaborators: {editorState.collaborators.length}</div>
      <div>Pending Operations: {editorState.pendingOperations}</div>
      
      <textarea
        value={editorState.content}
        onChange={(e) => editorActions.updateContent(e.target.value)}
      />
      
      <button onClick={() => editorActions.forceSync()}>
        Force Sync
      </button>
    </div>
  );
}
```

### Monitoring Collaboration Activity

```tsx
import { useCollaborationActivity } from '@/lib/operationalTransform/useRealtimeSync';

function CollaborationStatus({ noteId, userId }: { noteId: Id<"notes">, userId: string }) {
  const { collaborators, activeCollaborators, recentActivity } = useCollaborationActivity(noteId, userId);
  
  return (
    <div>
      <h3>Active Collaborators ({activeCollaborators.length})</h3>
      {activeCollaborators.map(userId => (
        <div key={userId}>{userId}</div>
      ))}
      
      <h3>Recent Activity</h3>
      {recentActivity.map(op => (
        <div key={op.operationId}>
          {op.userId}: {op.operation.type} at {new Date(op.timestamp).toLocaleTimeString()}
        </div>
      ))}
    </div>
  );
}
```

## How It Works

### Operation Flow

1. **User Types**: Text changes are captured and converted to operations
2. **Local Application**: Operations are applied immediately to local editor
3. **Server Submission**: Operations are sent to Convex with sequence numbers
4. **Conflict Resolution**: Server transforms operations against concurrent changes
5. **Broadcast**: Transformed operations are sent to all connected clients
6. **Remote Application**: Other clients apply transformed operations

### Conflict Resolution Example

```
Initial state: "Hello"

User A types " World" at position 5 → Insert(" World", 5)
User B types "!" at position 5 → Insert("!", 5)

Server receives A's operation first:
- A's operation: Insert(" World", 5) → "Hello World"
- B's operation transformed: Insert("!", 11) → "Hello World!"

Final state: "Hello World!"
```

### Vector Clocks

Each operation includes a vector clock to establish causal ordering:

```typescript
{
  operationId: "user1_client1_1_1234567890",
  vectorClock: { "user1": 1, "user2": 0 },
  operation: { type: "insert", position: 5, content: " World" }
}
```

## Performance Optimizations

1. **Operation Batching**: Multiple rapid keystrokes are merged into single operations
2. **Snapshots**: Periodic full-text snapshots reduce operation replay time
3. **Client Prediction**: Local operations are applied immediately
4. **Efficient Transforms**: Optimized transformation algorithms
5. **Selective Sync**: Only new operations are transmitted

## Error Handling

- **Network Failures**: Automatic reconnection with exponential backoff
- **Operation Conflicts**: Graceful transformation and resolution
- **Data Corruption**: Checksum validation for snapshots
- **Client Crashes**: Operations are persisted server-side

## Limitations

1. **Text Only**: Currently supports plain text/markdown editing
2. **No Rich Formatting**: Complex formatting attributes not yet supported
3. **No Cursor Sync**: Cursor positions are not synchronized (future enhancement)
4. **Memory Usage**: Long documents with many operations may use significant memory

## Future Enhancements

1. **Cursor Synchronization**: Show other users' cursor positions
2. **Rich Text Support**: Handle complex formatting operations
3. **Presence Indicators**: Show who's currently viewing/editing
4. **Operation Compression**: Compress operation history for better performance
5. **Offline Support**: Queue operations when offline and sync when reconnected

## Debugging

Enable debug logging:

```typescript
// In your component
const [editorState, editorActions] = useCollaborativeEditor(noteId, userId, {
  onError: (error) => {
    console.error('OT Error:', error);
    // Send to error tracking service
  },
});
```

Check operation history:

```typescript
import { useCollaborativeEditorStatus } from '@/lib/operationalTransform/useCollaborativeEditor';

const { recentOperations } = useCollaborativeEditorStatus(noteId, userId);
console.log('Recent operations:', recentOperations);
```

## Testing

The system includes comprehensive test coverage for:

- Operation transformation algorithms
- Conflict resolution scenarios
- Network failure recovery
- Concurrent editing stress tests

Run tests with:
```bash
npm test -- --testPathPattern=operationalTransform
```
