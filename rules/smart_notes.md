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

## 4. API Integration (`/api/smart_note_inline/*`)

- **Proxy Pattern**: The frontend does not directly call the backend AI services. Instead, it calls Next.js API routes located in `src/app/api/smart_note_inline/`.
- **Responsibilities**: These routes are responsible for:
  1.  Authenticating the request by checking for a `Bearer` token in the `Authorization` header.
  2.  Constructing a payload with the note content and other metadata.
  3.  Forwarding the request to the central backend AI service defined by `NEXT_PUBLIC_BACKEND_URL`.
- **Benefits**: This pattern keeps the frontend clean, secures the backend endpoint, and centralizes the logic for communicating with the AI service. 