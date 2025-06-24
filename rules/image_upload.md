# Image Gallery Modal for Smart Notes

This PRD outlines the design and implementation plan for the **Image Gallery Modal** feature in Smart Notes. It assumes only that the backend has a Cloud Run function for image uploads and that the `notes` table in Convex has an `images` field. No existing frontend implementation is assumed.

---

## 1. Objective

To build a user interface for uploading, viewing, and deleting images tied to a specific note. All image actions are handled within a modal accessible from the note editor UI.

---

## 2. Assumptions

* ✅ A Cloud Run function exists at `POST /save_image`, returning image metadata
* ✅ The Convex `notes` schema includes an `images?: ImageData[]` field

---

## 3. Data Model

```ts
interface ImageData {
  url: string;
  filename: string;
  originalFilename?: string;
  uploadedAt: number;
  size?: number;
  mimeType?: string;
  width?: number;
  height?: number;
}
```

Images are stored inline within each `Note` document.

---

## 4. User Experience

### Launch Point

* "🖼 View Image Gallery" button in `NoteHeader`
* Opens modal displaying current images and upload controls

### Modal Behavior

* Image grid with bordered containers
* Drag-and-drop area and file input for uploads
* Delete icon/button on each image
* Empty state message if no images

---

## 5. Functional Requirements

* Upload image file (jpg/png/gif/webp, max 10MB)
* POST to Cloud Run and receive `ImageData`
* Append returned image to `note.images`
* Display all images in modal
* Support deletion of individual images from `note.images`

---

## 6. API Details

### Upload Endpoint

```
POST https://us-central1-content-454219.cloudfunctions.net/save_image
```

**Payload**: `multipart/form-data` with a file field

**Response**:

```json
{
  "url": "...",
  "filename": "...",
  "originalFilename": "...",
  "uploadedAt": 1710000000,
  "size": 102400,
  "mimeType": "image/png",
  "width": 800,
  "height": 600
}
```

### Convex Integration

* Use a `notes.updateNote` mutation to add or remove images
* Full `images[]` must be passed on every update

---

## 7. Implementation Plan

### Step 1: Add `ImageData` to frontend types

* Update `types/index.ts` for `Note`, `NoteUpdate`

### Step 2: Build `ImageGalleryModal.tsx`

* Props: `noteId`, `images[]`, `onClose`
* Use `Dialog` for modal layout

### Step 3: Render image grid

* Tailwind grid
* Each image in bordered div with delete button

### Step 4: Add drag-and-drop + file input

* Accepts multiple images, max size 10MB

### Step 5: Create `useImageUpload` hook

* POSTs image to Cloud Function
* Returns parsed `ImageData`

### Step 6: Connect to Convex mutation

* Append image to note via mutation after successful upload
* Filter out image on delete

### Step 7: Wire modal into `NoteHeader.tsx`

* Toggle modal with state
* Pass down props

---

## 8. Acceptance Criteria

| Scenario                  | Expected Outcome                       |
| ------------------------- | -------------------------------------- |
| Upload valid image        | Image appears in modal + saved to note |
| Upload invalid/large file | Error message shown                    |
| Delete image              | Image removed from modal and note      |
| Modal opens               | Grid of current images shown           |
| Modal empty               | Graceful empty state shown             |

---

## 9. Dev Guidelines

* Use shared `Dialog`, `Button`, and Tailwind utility classes
* Display errors clearly on failed uploads
* Image containers must have consistent dimensions
* Maintain immutability when updating `images[]`

---

This PRD is the single source of truth for the image gallery feature. It should guide the complete implementation of frontend upload and display functionality, from modal UI to backend integration.
