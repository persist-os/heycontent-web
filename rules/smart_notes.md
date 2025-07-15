# Smart Notes Rules

This document outlines the architecture, data flow, and development conventions for the Smart Notes feature.

---

## 1. Overview

Smart Notes is an intelligent note-taking system designed for content creators. It combines a flexible note-taking environment with powerful, context-aware AI tools accessible directly within the editor. The system is built around a core set of typed notes, enabling specialized functionality for different creator workflows.

The feature is primarily composed of three main frontend components and a Convex backend schema:
- **`NotesGrid.tsx`**: The main dashboard for viewing, filtering, and managing all notes.
- **`NoteEditor.tsx`**: The core text editor where users write and edit note content.
- **`InlineCommandPalette.tsx`**: A modal that provides access to inline AI commands.
- **`convex/notes.ts`**: The backend schema defining the data structure and business logic for notes.

---

## 2. Data Model (`convex/notes.ts`)

The canonical data structure for a note is defined in `convex/notes.ts`.

### Note Schema

A `Note` object contains fields for content, metadata, and associations. Key fields include:
- `userId`: The owner of the note.
- `title`: The title of the note.
- `content`: The main body of the note (Markdown supported).
- `type`: A specific `NoteType` that defines the note's purpose.
- `important`: A boolean flag for prioritizing notes.
- `tags`: An array of string tags for organization.
- `platform`: The social platform this note might be associated with.
- `analysis`: Stores the output of an AI analysis.

### Note Types

The `type` field is critical, as it dictates the note's function and how it's handled across the application. The single source of truth for these types is the `noteType` union in `convex/notes.ts`.

| Type Name | UI Label (in `NotesGrid.tsx`) | Description |
|---|---|---|
| `idea_bank` | Idea Bank | For brainstorming and collecting raw ideas. **(Default type)** |
| `content_script` | Content/Script | For writing structured video or post scripts. |
| `analytics_insight`| Analytics/Insights| For analyzing data and performance metrics. |
| `collaboration_note`| Collaboration | For team notes, feedback, and shared workflows. |
| `reflection_journal`| Journal | For personal reflections and documenting learnings. |
| `task_checklist` | To-Do List | For creating actionable checklists and managing tasks. |

**Convention**: When adding a new note type, it **must** first be added to the `noteType` union in `convex/notes.ts`. Subsequently, it must be added to the `noteTypes` array in `NotesGrid.tsx` to be rendered correctly in the UI filters.

---

## 3. Frontend Architecture & Workflow

The user experience flows from a macro view of all notes down to the micro view of editing a single note, with AI tools available at the lowest level.

### `NotesGrid.tsx`: The Management Hub

- **Purpose**: Displays all of the user's notes in a masonry-style grid.
- **Filtering**: Provides a search bar (filters by title/content) and a set of filter buttons based on the `NoteType`. The UI for these filters is hardcoded in the `noteTypes` array within this component, including display labels and colors.
- **Sorting**: Notes are sorted with `important` notes appearing first, followed by the most recently updated (`updatedAt`).
- **Actions**: Users can create a new note, edit an existing one (which navigates to the editor view), delete, and toggle its importance directly from the `NoteCard` components within the grid.

### `NoteEditor.tsx`: The Core Writing Experience

- **Purpose**: A full-featured text editor for a single note. It is built around a standard `<textarea>` element.
- **AI Entry Point**: This component is the gateway to the inline AI features. It listens for two specific user actions to launch the command palette:
  1.  **Keyboard Shortcut**: `Cmd/Ctrl + K`
  2.  **Slash Command**: Typing `/` at the beginning of a new line.
- **Palette Spawning**: Upon detecting an entry point, `NoteEditor` calculates the current text cursor's coordinates and renders the `InlineCommandPalette` at that position, creating a seamless "inline" feel.

### `InlineCommandPalette.tsx`: The AI Command Center

- **Purpose**: A floating modal that provides a list of context-aware AI actions.
- **State Management**: The palette is highly stateful and manages multiple views internally:
  - **Main View**: Shows primary commands like "Generate ideas" or "Request analysis".
  - **Analysis View**: If the user selects "Request analysis," the palette's view changes to show a list of `NoteType` options to guide the analysis.
  - **Prompt View**: If the user starts typing in the input field, the view changes to a prompt-and-submit interface for direct interaction with the AI.
- **Data Flow**:
  1.  A user selects a command (e.g., clicks "Generate ideas").
  2.  The palette's `action` handler is triggered.
  3.  This `action` calls a function passed down via props from `NoteEditor.tsx` (e.g., `handleRequestIdeas`).
  4.  The `NoteEditor`'s handler, powered by the `useInlineAI` hook, makes a request to the appropriate Next.js API route (e.g., `/api/smart_note_inline/note-idea-suggestions`).
  5.  Upon receiving a successful response, the handler uses the `insertAtCursor` utility to append the AI-generated text directly into the `textarea` in `NoteEditor`.

### Color Scheme for Selections

A key UI convention within the `InlineCommandPalette` is the selection highlight color.

- **Light Mode**: Selected items have a `purple` background (`bg-purple-500/10`) and text (`text-purple-600`).
- **Dark Mode**: Selected items have a `yellow` background (`dark:bg-yellow-500/10`) and text (`dark:text-yellow-400`).

This non-obvious color switch is a deliberate design choice that must be maintained.

---

## 4. API Integration

### Inline AI Commands (`/api/v1/smart-notes-inline/*`)

- **Proxy Pattern**: The frontend does not directly call the backend AI services. Instead, it calls Next.js API routes located in `src/app/api/smart_note_inline/`.
- **Responsibilities**: These routes are responsible for:
  1.  Authenticating the request by checking for a `Bearer` token in the `Authorization` header.
  2.  Constructing a payload with the note content and other metadata.
  3.  Forwarding the request to the central backend AI service defined by `NEXT_PUBLIC_BACKEND_URL`.
- **Benefits**: This pattern keeps the frontend clean, secures the backend endpoint, and centralizes the logic for communicating with the AI service.

### Automatic Metadata Generation (`/api/v1/smart-notes/generate-metadata`)

- **Endpoint**: `POST /api/v1/smart-notes/generate-metadata`
- **Purpose**: This endpoint provides a "fire-and-forget" mechanism for enriching notes automatically. It is separate from the inline command system.
- **Frontend Workflow**:
  - This route should be called by the frontend shortly after a new note is created or when an existing note's content has been significantly modified and saved.
  - The frontend should send the full `noteId` and `note_content` in the request body.
  - The backend will then asynchronously generate a title, tags, and type for the note and update it directly in Convex. The frontend can listen for data changes via its Convex subscription to update the UI once the new metadata is available.

---

## 5. Rich Text Editor & Enhanced Formatting

### `RichTextEditor.tsx`: Enhanced Markdown Editor

The `RichTextEditor` component (`src/components/ui/rich-text-editor.tsx`) provides a comprehensive writing experience with markdown support, live preview, and advanced formatting capabilities.

#### Core Features

- **Dual Mode Interface**: Seamless switching between edit mode (textarea) and preview mode (rendered markdown)
- **Live Preview**: Real-time markdown rendering with custom components for enhanced content display
- **Keyboard Shortcuts**: Comprehensive set of formatting shortcuts for efficient writing
- **Command Palette Integration**: Direct access to AI tools and formatting commands via `Cmd/Ctrl + K` or `/`

#### Formatting Support

**Text Formatting:**
- **Bold**: `Cmd/Ctrl + B` → `**text**`
- **Italic**: `Cmd/Ctrl + I` → `*text*`
- **Underline**: `Cmd/Ctrl + U` → `<u>text</u>`

**Structural Elements:**
- **Headings**: Via command palette (H1, H2, H3) → `# Heading`
- **Bullet Lists**: Via command palette → `- Item`
- **Numbered Lists**: Via command palette → `1. Item`

**Links & Embeds:**
- **Regular Links**: Via command palette → `[text](url)`
- **Rich Link Embeds**: Via command palette → `[embed](url)`

### Link Embedding System

The Smart Notes system includes a sophisticated link embedding feature that transforms simple URL references into rich, interactive content previews.

#### Link Types & Rendering

**1. Regular Links (`[text](url)`)**
- Rendered as clickable links with visual indicators
- Icons added based on content type:
  - `Play` icon for YouTube videos
  - `Image` icon for image URLs
  - `ExternalLink` icon for generic URLs

**2. Rich Link Embeds (`[embed](url)`)**
- **YouTube Videos**: Full iframe embed with responsive aspect ratio
- **Images**: Responsive image display with error handling
- **Generic URLs**: Rich preview cards with metadata and direct access links

#### Implementation Details

**YouTube Embed Detection:**
```regex
/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
```

**Image Detection:**
```regex
/\.(jpg|jpeg|png|gif|webp|svg)$/i
```

**Example Usage:**
```markdown
Regular link: [Visit YouTube](https://youtube.com/watch?v=abc123)
Rich embed: [embed](https://youtube.com/watch?v=abc123)
Image embed: [embed](https://example.com/image.jpg)
```

### Command Palette Enhancements

The `InlineCommandPalette.tsx` has been enhanced with formatting and link insertion capabilities:

#### New Commands

| Command | Category | Description | Keyboard Shortcut |
|---------|----------|-------------|-------------------|
| Insert link | Format | Creates a standard markdown link with URL and text fields | - |
| Embed link | Format | Creates a rich link embed for enhanced previews | - |
| Bullet list | Format | Inserts bullet point list formatting | - |
| Numbered list | Format | Inserts numbered list formatting | - |
| Heading 1-3 | Format | Inserts heading at specified level | - |

#### Input Handling

The palette supports multiple input modes:
- **Dual Input Mode**: For link insertion (URL + text fields)
- **Single Input Mode**: For embed links (URL only)
- **Prompt Mode**: For AI interactions
- **Selection Mode**: For command selection

#### State Management

The palette manages complex state flows:
```typescript
interface PaletteState {
  showAIPrompt: boolean
  showAnalysisTypes: boolean
  showLinkInput: boolean
  showLinkEmbedInput: boolean
  selectedIndex: number
  loadingCommand: string | null
}
```

### Markdown Rendering (`MarkdownRenderer.tsx`)

The markdown renderer has been enhanced to support the new formatting features:

#### Custom Components

- **LinkEmbed Component**: Handles rich link rendering with type detection
- **Underline Component**: Supports HTML `<u>` tags with proper styling
- **Enhanced List Rendering**: Improved spacing and typography for lists
- **Responsive Media**: Automatic responsive handling for embedded content

#### Plugins Used

- **remark-gfm**: GitHub Flavored Markdown support
- **rehype-raw**: Enables HTML tag rendering (required for underline support)

#### Error Handling

- **Broken Images**: Graceful degradation with `onError` handlers
- **Invalid Embeds**: Fallback to generic link preview
- **Network Issues**: Timeout and retry mechanisms for external content

### Usage Guidelines

#### For Developers

1. **Adding New Link Types**: Extend the `LinkEmbed` component with new URL pattern detection
2. **Custom Formatting**: Add new keyboard shortcuts to the `handleKeyDown` function in `RichTextEditor`
3. **Command Palette Extensions**: Add new commands to the `mainCommands` array in `InlineCommandPalette`

#### For Users

1. **Keyboard Shortcuts**: Use `Cmd/Ctrl + [B/I/U]` for quick formatting
2. **Command Access**: Use `Cmd/Ctrl + K` or type `/` at line start for command palette
3. **Link Previews**: Use `[embed](url)` format for rich content previews
4. **Preview Mode**: Click the Preview button to see rendered output with all enhancements

#### Best Practices

- Use regular links for simple references: `[GitHub](https://github.com)`
- Use embed format for media content: `[embed](https://youtube.com/watch?v=...)`
- Leverage keyboard shortcuts for efficient formatting workflows
- Switch to preview mode to verify rich content rendering before saving 