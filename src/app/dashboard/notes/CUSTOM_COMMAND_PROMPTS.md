# Custom Command Prompts for Inline Command Palette

## Overview

The Inline Command Palette now supports **user-specific custom prompts** that appear alongside the hardcoded default prompts. These custom prompts are:

- ✅ **User-specific**: Each user has their own set of custom prompts
- ✅ **Persistent**: Stored in Convex `ambientInsights` table
- ✅ **Context-aware**: Can be filtered by note type
- ✅ **Seamlessly integrated**: Appear in a "Custom" category at the top of the palette
- ✅ **Optimized for inline writing**: Designed as statements (not questions) that leave room for user customization

## Architecture

### Data Flow

```
Frontend (InlineCommandPalette)
  ↓ useQuery (Convex Direct)
Convex Query (getCustomCommandPrompts)
  ↓ reads from
ambientInsights table
```

### Schema

```typescript
ambientInsights: {
  userId: string;
  customCommandPrompts?: Array<{
    id: string;
    label: string;
    category: string;
    noteType?: string;
  }>;
  // ... other fields
}
```

### API Endpoints

**GET** `/api/users/:id/custom-command-prompts`
- Fetches custom prompts for a user
- Returns: `{ success: true, data: CustomCommandPrompt[] }`

**POST** `/api/users/:id/custom-command-prompts`
- Updates custom prompts for a user
- Body: `{ customCommandPrompts: CustomCommandPrompt[] }`
- Returns: `{ success: true }`

## Usage

### From Browser Console

```javascript
// 1. Import the helper function and examples
import { 
  addCustomPromptsForUser, 
  BOOK_WRITING_PROMPTS,
  STARTUP_PROMPTS,
  RESEARCH_PROMPTS,
  CONTENT_CREATOR_PROMPTS
} from '@/app/dashboard/notes/utils/custom-prompts-examples';

// 2. Get your user ID (from auth context)
const userId = 'your-firebase-uid';

// 3. Add custom prompts
await addCustomPromptsForUser(userId, BOOK_WRITING_PROMPTS);

// 4. Or combine multiple sets
await addCustomPromptsForUser(userId, [
  ...BOOK_WRITING_PROMPTS,
  ...CONTENT_CREATOR_PROMPTS
]);
```

### Creating Custom Prompts

```typescript
const myCustomPrompts = [
  {
    id: 'my-prompt-1',
    label: 'Outline my thesis on',
    category: 'Academic',
    noteType: 'content_script' // Optional - targets specific note types
  },
  {
    id: 'my-prompt-2',
    label: 'Analyze the implications of',
    category: 'Analysis',
    // No noteType = shows up for all note types
  }
];

await addCustomPromptsForUser(userId, myCustomPrompts);
```

## Design Principles

### Why Statements, Not Questions?

The inline writing agent is designed to write **AS the user**, not **TO the user**. Therefore:

❌ **Bad** (question format):
```
"What should I write about in my book?"
```

✅ **Good** (statement format):
```
"Outline the structure for chapter"
```

The statement format:
- Leaves room for the user to add context (e.g., "Outline the structure for chapter 3 about character development")
- Matches the agent's voice (writes as if the user had the insight)
- Integrates seamlessly with the inline writing flow

### Prompt Design Guidelines

1. **Keep prompts short** - Users should be able to add context before sending
2. **Use action verbs** - "Outline", "Develop", "Expand", "Describe", "Analyze"
3. **Be specific to user's domain** - Tailor to their projects (book, startup, research, etc.)
4. **Categorize clearly** - Use meaningful categories ("Book Writing", "Research", "Startup")
5. **Target note types when relevant** - Some prompts work better for specific note types

## Examples by User Type

### Book Author
```typescript
const prompts = [
  { label: 'Outline the structure for chapter', category: 'Book Writing' },
  { label: 'Develop character background for', category: 'Book Writing' },
  { label: 'Describe the scene where', category: 'Book Writing' },
  { label: 'Expand this into natural dialogue between', category: 'Book Writing' },
  { label: 'Continue the plot by showing how', category: 'Book Writing' }
];
```

### Startup Founder
```typescript
const prompts = [
  { label: 'Create pitch deck slide about', category: 'Startup' },
  { label: 'Draft investor update covering', category: 'Startup' },
  { label: 'Plan product roadmap for', category: 'Startup' },
  { label: 'Analyze competitive landscape for', category: 'Startup' }
];
```

### Researcher
```typescript
const prompts = [
  { label: 'Summarize key findings from research on', category: 'Research' },
  { label: 'Design research methodology for studying', category: 'Research' },
  { label: 'Formulate hypothesis about', category: 'Research' },
  { label: 'Analyze data patterns showing', category: 'Research' }
];
```

### Content Creator
```typescript
const prompts = [
  { label: 'Write video script introducing', category: 'Content' },
  { label: 'Create engaging social media caption about', category: 'Content' },
  { label: 'Brainstorm content ideas around', category: 'Content' },
  { label: 'Outline blog post structure for', category: 'Content' }
];
```

## Testing

### Manual Testing

1. **Open browser console** in the notes dashboard
2. **Run** the helper function with example prompts:
   ```javascript
   // Get user ID from auth context
   const userId = firebase.auth().currentUser.uid;
   
   // Add example prompts
   await fetch(`/api/users/${userId}/custom-command-prompts`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       customCommandPrompts: [
         {
           id: 'test-1',
           label: 'Write about my journey with',
           category: 'Personal'
         },
         {
           id: 'test-2',
           label: 'Outline the strategy for',
           category: 'Planning',
           noteType: 'project'
         }
       ]
     })
   });
   ```

3. **Open any note** in the editor
4. **Trigger the command palette** (Cmd/Ctrl + K or select text and click AI button)
5. **Verify** custom prompts appear in the "Custom" category at the top
6. **Test filtering** - Switch to "Projects" note type and verify only relevant prompts show

### Expected Behavior

- ✅ Custom prompts appear in "Custom" category
- ✅ Custom prompts show **Sparkles** icon (✨)
- ✅ Clicking a custom prompt populates the input field
- ✅ User can edit the populated text before sending
- ✅ Prompts filter correctly by note type (if specified)
- ✅ Prompts persist across page reloads
- ✅ Prompts are user-specific (other users don't see them)

## Future Enhancements

- [ ] UI for adding/editing custom prompts in settings
- [ ] AI-generated custom prompts based on user's writing patterns
- [ ] Sharing custom prompt sets between users
- [ ] Import/export custom prompt collections
- [ ] Analytics on which prompts are most used

## Technical Details

### Files Modified

1. **`heycontent-web/convex/schema.ts`**
   - Added `customCommandPrompts` field to `ambientInsights` table

2. **`heycontent-web/convex/ambientInsights.ts`**
   - Added `CustomCommandPrompt` interface
   - Added `getCustomCommandPrompts` query
   - Added `updateCustomCommandPrompts` mutation

3. **`heycontent-web/convex/http.ts`**
   - Added GET `/api/users/:id/custom-command-prompts` endpoint
   - Added POST `/api/users/:id/custom-command-prompts` endpoint

4. **`heycontent-web/src/app/dashboard/notes/components/InlineCommandPalette.tsx`**
   - Added `useQuery` to fetch custom prompts
   - Updated `getAllCommands()` to merge custom prompts with defaults
   - Custom prompts display with Sparkles icon

5. **`heycontent-web/src/app/dashboard/notes/utils/custom-prompts-examples.ts`** (new file)
   - Example prompt sets for different user types
   - Helper function to add custom prompts

## Related Documentation

- **Inline Writing Agent Instructions**: `backend/app/prompts/smart_notes_inline/instructions.txt`
- **Command Configs**: `heycontent-web/src/app/dashboard/notes/utils/command-configs.ts`
- **Refinement Configs**: `heycontent-web/src/app/dashboard/notes/utils/refinement-configs.ts`

## Questions?

For issues or questions about custom command prompts:
1. Check the browser console for errors
2. Verify prompts are saved in Convex dashboard
3. Ensure user is authenticated (firebaseUser exists)
4. Check network tab for API call failures

