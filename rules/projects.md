Here’s a refined version of your **Projects in Smart Notes PRD**, cleaned for clarity, structure, and developer friendliness—while keeping everything lean, implementable, and scalable.

---

# Product Requirements Document (PRD): Projects in Smart Notes

---

## 🧭 1. Overview

**Goal:**
Let users group their smart notes, conversations, content, and analytics into flexible, user-defined “Projects.” Projects offer an intuitive way to organize work, with drag-and-drop, unified views, and accessible attachment management.

---

## ✅ 2. Objectives & Success Criteria

* Users can **create, rename, and delete projects**.
* Users can **attach/detach** various item types (notes, convos, etc.) to/from a project.
* Projects display all attached items in a **unified view**, grouped by type.
* **Drag-and-drop** + accessible “Add/Remove” flows.
* **Backend calls minimized** using batched queries and selective mutations.
* Clean, performant, **modular UI**, consistent with existing design system.

---

## 👤 3. User Stories

### 3.1 Project CRUD

* I can create a new project with a name + optional description.
* I can rename or delete my project at any time.
* I can see all of my projects in a list/grid.

### 3.2 Attachment Management

* I can drag and drop items into a project.
* I can detach items via drag-out or button click.
* I can browse/search all available attachable items.
* I can see attached items grouped by type (notes, content, etc.).

### 3.3 Project View

* I can open a project and see all its items.
* I can click into any item to open/edit in its native view.

### 3.4 Accessibility

* I can navigate projects and attach/detach items with keyboard.
* I get visual + auditory feedback when actions succeed/fail.

---

## 🔧 4. Functional Requirements

### 4.1 Convex Data Model

#### `projects` table

```ts
{
  userId: string
  name: string
  description?: string
  noteIds?: string[]
  conversationIds?: string[]
  contentIds?: string[]
  analyticsIds?: string[]
  createdAt: number
  updatedAt: number
}
```

#### Indexes

* `byUserId`

---

### 4.2 Backend API (Convex Functions)

#### ✅ Mutations

* `createProject({ userId, name, description })`
* `updateProject({ projectId, name?, description? })`
* `deleteProject({ projectId })`
* `addItemToProject({ projectId, itemType, itemId })`
* `removeItemFromProject({ projectId, itemType, itemId })`

#### 📥 Queries

* `getProjectsForUser({ userId })`
* `getProjectDetails({ projectId })` → returns full attached item bundles.

#### ⚙️ Optimization

* All attached item data is returned via `getProjectDetails` in a **single query**.
* Mutations modify only the project doc, not the items themselves.

---

### 4.3 Frontend Architecture

#### 📦 Hooks

* `useProjectsData(userId)`
* `useProjectDetails(projectId)`

#### 🧩 Components

* **Sidebar/Tab:** Projects list + “New Project” CTA.
* **Project View Page:** Name, description, edit/delete, grouped item list.
* **Attachment Modal/Panel:**

  * Two columns: available vs. attached items.
  * Drag-and-drop + Add/Remove buttons.
  * Search/filter + grouped by type.
* **Item Cards:** Use existing reusable components.

#### 🎨 UI Details

* Use `react-beautiful-dnd` (or modern, maintained alternative).
* Optimistic UI: update state immediately, then sync backend.
* Show inline feedback via toast/system messages.

---

## 📏 5. Non-Functional Requirements

* **Performance:** All project data is fetched in bulk; no redundant Convex calls.
* **Scalability:** Supports hundreds of projects and thousands of items per user.
* **Accessibility:** Fully navigable via keyboard + screen reader.
* **Security:** Only authenticated users can access their projects.
  🔒 **Tip:** Never call Firebase Auth directly — always use `api-helpers/api-utils` to get auth from cookies.

---

## 🚫 6. Out of Scope

* Project collaboration/sharing.
* Nested/sub-projects.
* Manual item sorting within a project (future enhancement).

---

## ❓ 7. Open Questions

* **Multiple project membership per item?** → ✅ Yes (default)
* **Item/project limits?** → No hard limit; soft warnings only if perf suffers.
* **Custom icons/colors?** → ✅ Yes, reuse image support from `BaseCard`.

---

## 🛠️ 8. Milestones & Deliverables

### Backend

* [ ] Add `projects` schema to Convex.
* [ ] Implement queries and mutations.

### Frontend

* [ ] Add types and hooks.
* [ ] Build sidebar + project view.
* [ ] Build attachment modal/panel (drag + accessible controls).
* [ ] Integrate with existing cards.
* [ ] Add feedback, a11y, and performance polish.

### Testing

* [ ] Backend unit + integration tests.
* [ ] Frontend UI + accessibility testing.

---

## ⚠️ Tips & Pitfalls to Avoid

* Don’t fetch each item separately; always **batch fetch** project items.
* Avoid prop drilling and state bloat—**use modular hooks**.
* Never call Firebase directly—**always wrap auth with helper functions** in @api-utils or @api-helpers
* No inline styles; extract CSS cleanly into `.css.ts` or tailwind classes.
* Modularize logic; **no file over 400 lines**.
* Drag-and-drop must have **keyboard fallback** and **ARIA roles**.

---

Let me know if you want this turned into a Notion page or GitHub issue template next.
