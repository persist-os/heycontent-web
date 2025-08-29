# Personal Notes System Rules

This document outlines the architecture, data flow, and development conventions for HeyContext's personal notes system - a private workspace for organizing thoughts, ideas, and insights.

---

## 1. Overview

The personal notes system is designed for individual thought organization and reflection. It combines flexible note-taking with AI assistance to help users process ideas, make decisions, and maintain continuity in their thinking. The system supports different note types to accommodate various ways people organize their thoughts.

The feature is composed of three main frontend components and a Convex backend schema:
- **`NotesGrid.tsx`**: The main dashboard for viewing, filtering, and managing all notes
- **`NoteEditor.tsx`**: The core writing environment where users capture and develop thoughts
- **`InlineCommandPalette.tsx`**: AI assistance tools accessible directly within the editor
- **`convex/notes.ts`**: The backend schema defining data structure and business logic

---

## 2. Data Model (`convex/notes.ts`)

The canonical data structure for a note is defined in `convex/notes.ts`.

### Note Schema

A `Note` object contains fields for content, metadata, and personal organization. Key fields include:
- `userId`: The owner of the note (private by default)
- `title`: The title of the note
- `content`: The main body of the note (Markdown supported)
- `type`: A specific `NoteType` that defines the note's purpose
- `important`: A boolean flag for prioritizing notes
- `tags`: An array of string tags for personal organization
- `analysis`: Stores AI insights and analysis

### Note Types

The `type` field determines how the note is categorized and what AI assistance is available. The single source of truth for these types is the `noteType` union in `convex/notes.ts`.

| Type Name | UI Label | Description |
|---|---|---|
| `idea_bank` | Ideas | For capturing thoughts, concepts, and inspiration **(Default type)** |
| `content_script` | Writing | For drafting and organizing written content and documents |
| `analytics_insight`| Insights | For recording important learnings, observations, and discoveries |
| `collaboration_note`| People | For tracking relationships, conversations, and collaboration details |
| `reflection_journal`| Reflection | For working through complex thoughts and personal analysis |
| `task_checklist` | Tasks | For organizing what needs to be done and tracking progress |
| `email_draft` | Messages | For preparing emails, responses, and important communications |

**Convention**: When adding a new note type, it **must** first be added to the `noteType` union in `convex/notes.ts`. Subsequently, it must be added to the `noteTypes` array in `NotesGrid.tsx` to be rendered correctly in the UI filters.

---

## 3. Frontend Architecture & Workflow

The user experience flows from a broad view of all notes down to focused writing and thinking, with AI assistance available throughout.

### `NotesGrid.tsx`: The Personal Dashboard

- **Purpose**: Displays all of the user's notes in an organized, scannable layout
- **Filtering**: Provides search functionality (filters by title/content) and type-based filters. The UI for these filters is defined in the `noteTypes` array within this component
- **Sorting**: Notes are sorted with `important` notes appearing first, followed by most recently updated (`updatedAt`)
- **Actions**: Users can create new notes, edit existing ones, delete, and mark important directly from the `NoteCard` components
- **Privacy**: All notes are private by default with no sharing capabilities

### `NoteEditor.tsx`: The Thinking Space

- **Purpose**: A focused writing environment for capturing and developing thoughts
- **AI Integration**: Provides access to AI assistance through two entry points:
  1. **Keyboard Shortcut**: `Cmd/Ctrl + K`
  2. **Slash Command**: Typing `/` at the beginning of a new line
- **Contextual Assistance**: The AI suggestions are tailored to the note type and content
- **Continuity**: Maintains context and memory across editing sessions

### `InlineCommandPalette.tsx`: The AI Assistant

- **Purpose**: A contextual AI assistant that adapts to different thinking needs
- **Personal Focus**: Commands are designed for personal reflection, learning, and organization rather than public content
- **State Management**: The palette manages multiple interaction modes:
  - **Suggestion Mode**: Shows AI suggestions that populate the text input for editing
  - **Command Mode**: Provides quick actions for formatting and organization
  - **Analysis Mode**: Offers different types of personal analysis based on note type
- **Human-Friendly**: All suggestions use accessible language suitable for anyone

### Data Flow for AI Assistance

1. User triggers AI assistance (Cmd+K or `/`)
2. Palette shows contextual suggestions based on note type and content
3. User selects a suggestion, which **populates the text input** for editing
4. User can modify the suggestion before executing
5. AI assistance is provided through the `useInlineAI` hook
6. Results are inserted into the note at the cursor position

### Color Scheme for UI Elements

Selection and interaction colors follow the theme system:
- **Light Mode**: Selected items use purple (`bg-purple-500/10`, `text-purple-600`)
- **Dark Mode**: Selected items use yellow (`dark:bg-yellow-500/10`, `dark:text-yellow-400`)

This color switching maintains visual consistency with the overall HeyContext design.

---

## 4. API Integration

### Personal AI Commands (`/api/v1/smart-notes-inline/*`)

- **Privacy-First**: All API calls maintain user privacy with no data sharing
- **Proxy Pattern**: Frontend calls Next.js API routes in `src/app/api/smart_note_inline/`
- **Authentication**: Routes authenticate using `Bearer` token in `Authorization` header
- **Backend Communication**: Routes forward requests to `NEXT_PUBLIC_BACKEND_URL` with user context
- **Personal Context**: AI assistance is tailored to individual thinking patterns and note history

### Automatic Enhancement (`/api/v1/smart-notes/generate-metadata`)

- **Endpoint**: `POST /api/v1/smart-notes/generate-metadata`
- **Purpose**: Automatically enriches notes with helpful metadata while maintaining privacy
- **Workflow**:
  - Called after note creation or significant content changes
  - Sends `noteId` and `note_content` in request body
  - Backend generates title, tags, and type suggestions
  - Updates are applied directly in Convex
  - Frontend receives updates through Convex subscription

---

## 5. Enhanced Writing Experience

### `RichTextEditor.tsx`: Personal Writing Environment

The rich text editor provides a comfortable space for personal writing and reflection.

#### Core Features

- **Distraction-Free Writing**: Clean interface that supports focused thinking
- **Live Preview**: Real-time markdown rendering for immediate feedback
- **Personal Shortcuts**: Keyboard shortcuts optimized for personal note-taking
- **AI Integration**: Seamless access to thinking assistance via `Cmd/Ctrl + K` or `/`

#### Formatting Support

**Text Formatting:**
- **Bold**: `Cmd/Ctrl + B` → `**text**`
- **Italic**: `Cmd/Ctrl + I` → `*text*`
- **Underline**: `Cmd/Ctrl + U` → `<u>text</u>`

**Organization:**
- **Headings**: Via command palette (H1, H2, H3) → `# Heading`
- **Lists**: Bullet and numbered lists for organizing thoughts
- **Links**: For referencing external resources

### Command Palette for Personal Use

The `InlineCommandPalette.tsx` provides AI assistance tailored to personal thinking:

#### Personal AI Commands

| Command Category | Purpose | Example |
|------------------|---------|---------|
| Ideas | Brainstorming and concept development | "Help me explore this idea further" |
| Writing | Organizing thoughts into clear text | "Help me structure this argument" |
| People | Processing relationship thoughts | "Help me understand this conversation" |
| Insights | Capturing and organizing learnings | "What can I learn from this experience?" |
| Reflection | Working through complex feelings | "Help me process this situation" |
| Tasks | Personal productivity and organization | "Break this goal into manageable steps" |
| Messages | Drafting personal communications | "Help me write this email thoughtfully" |

#### Interaction Design

- **Suggestion Population**: AI suggestions populate text input for user editing
- **Non-Intimidating**: All language is accessible and supportive
- **Personal Context**: Suggestions consider user's thinking patterns and note history
- **Privacy-Focused**: No suggestions involve sharing or public actions

### Markdown Rendering for Personal Notes

The markdown renderer supports personal note-taking needs:

#### Enhanced Components

- **Personal Links**: Clean rendering of reference links
- **Thought Organization**: Improved list and heading rendering
- **Private Media**: Support for personal images and documents
- **Reading Comfort**: Typography optimized for extended reading

#### Privacy Considerations

- **No External Tracking**: Links and embeds don't expose user data
- **Local Processing**: Rendering happens client-side when possible
- **Secure References**: External content loaded with privacy protections

---

## 6. Development Guidelines

### Privacy-First Development

1. **No Social Features**: Never add sharing, collaboration, or public features
2. **User Data Protection**: All user content stays private and secure
3. **Minimal External Calls**: Limit external API calls and ensure they're privacy-safe
4. **Local Processing**: Prefer client-side processing when possible

### Human-Centered Design

1. **Accessible Language**: All UI text must be understandable by anyone
2. **Supportive Tone**: Interface should feel encouraging and non-judgmental
3. **Flexible Use**: Don't force users into specific workflows or use cases
4. **Personal Metaphors**: Use notebook, journal, and thinking space metaphors

### Technical Standards

1. **Performance**: Ensure smooth experience for extended writing sessions
2. **Reliability**: Notes must save reliably and maintain user trust
3. **Accessibility**: Full keyboard navigation and screen reader support
4. **Mobile Comfort**: Optimize for mobile writing and reflection

### AI Integration Principles

1. **Contextual Assistance**: AI suggestions should understand the user's thinking context
2. **User Control**: Always let users edit AI suggestions before applying
3. **Personal Learning**: AI should adapt to individual thinking patterns over time
4. **Non-Intrusive**: AI assistance should feel helpful, not pushy or overwhelming

---

## 7. Future Considerations

### Planned Enhancements

- **Better Context Understanding**: Improved AI awareness of user's thinking patterns
- **Cross-Note Insights**: Connections between related thoughts and ideas
- **Enhanced Privacy**: Additional privacy controls and local processing options
- **Accessibility Improvements**: Enhanced support for different thinking and communication styles

### Maintaining Vision

All future development should reinforce HeyContext's core purpose as a private, personal thinking space. Features should support individual reflection, learning, and growth rather than productivity optimization or social interaction.