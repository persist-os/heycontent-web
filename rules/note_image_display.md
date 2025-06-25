# ImageMosaic Preview System – PRD

## Overview

Implement a simple, responsive image preview mosaic in each `BaseCard` component. If a note contains image attachments, the mosaic will visually summarize up to 4 images with a "+X more" overlay if applicable. Clicking the preview opens the existing `ImageGalleryModal` for full image management.

---

## Goals

* Add visual image previews to cards with image attachments
* Keep the implementation modular, fast, and clean
* Ensure it is mobile-first and responsive
* Reuse the existing modal system for full viewing
* Maintain clear, testable layout logic
* Follow existing codebase TypeScript and component patterns

---

## Non-Goals

* No AI-driven layout logic
* No dynamic image cropping
* No CDN/image optimization

---

## Architecture Plan

```
BaseCard
├── useState for modal control (existing pattern)
└── ImageMosaic (New)
    ├── SingleImageLayout
    ├── DualImageLayout
    ├── TrioImageLayout
    └── QuadImageLayout (+X more)
```

---

## File Structure

```
src/
└── app/
    └── dashboard/
        └── notes/
            └── components/
                ├── BaseCard.tsx (modified)
                └── ImageMosaic.tsx (new - all layouts in one file)
```

**Note**: Based on codebase patterns, keeping all layout components in one file to avoid over-fragmentation.

---

## Implementation Steps

### Step 1: Create the ImageMosaic Component

**File**: `src/app/dashboard/notes/components/ImageMosaic.tsx`

```tsx
'use client';

import React from 'react';
import { ImageData } from '../types';
import { cn } from '@/lib/utils';

interface ImageMosaicProps {
  images: ImageData[];
  onOpenGallery: () => void;
  className?: string;
}

interface SingleImageProps {
  image: ImageData;
}

interface MultiImageProps {
  images: ImageData[];
}

interface QuadImageProps {
  images: ImageData[];
  remainingCount: number;
}

// Layout Components
const SingleImageLayout: React.FC<SingleImageProps> = ({ image }) => (
  <img
    src={image.url}
    alt={image.originalFilename || image.filename || 'Note image'}
    loading="lazy"
    className="w-full h-full object-cover rounded-lg"
  />
);

const DualImageLayout: React.FC<MultiImageProps> = ({ images }) => (
  <div className="grid grid-cols-2 gap-1 h-full">
    {images.map((img, i) => (
      <img
        key={img.filename || i}
        src={img.url}
        alt={img.originalFilename || img.filename || `Note image ${i + 1}`}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    ))}
  </div>
);

const TrioImageLayout: React.FC<MultiImageProps> = ({ images }) => (
  <div className="grid grid-cols-2 gap-1 h-full">
    <div className="row-span-2">
      <img
        src={images[0].url}
        alt={images[0].originalFilename || images[0].filename || 'Note image 1'}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
    <div className="grid grid-rows-2 gap-1">
      <img
        src={images[1].url}
        alt={images[1].originalFilename || images[1].filename || 'Note image 2'}
        loading="lazy"
        className="w-full h-full object-cover"
      />
      <img
        src={images[2].url}
        alt={images[2].originalFilename || images[2].filename || 'Note image 3'}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
  </div>
);

const QuadImageLayout: React.FC<QuadImageProps> = ({ images, remainingCount }) => (
  <div className="grid grid-cols-2 gap-1 h-full">
    {images.slice(0, 3).map((img, i) => (
      <img
        key={img.filename || i}
        src={img.url}
        alt={img.originalFilename || img.filename || `Note image ${i + 1}`}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    ))}
    <div className="relative">
      <img
        src={images[3].url}
        alt={images[3].originalFilename || images[3].filename || 'Note image 4'}
        loading="lazy"
        className="w-full h-full object-cover"
      />
      {remainingCount > 0 && (
        <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-sm font-medium rounded">
          +{remainingCount} more
        </div>
      )}
    </div>
  </div>
);

// Main Component
export const ImageMosaic: React.FC<ImageMosaicProps> = ({ 
  images, 
  onOpenGallery, 
  className 
}) => {
  const previewImages = images.slice(0, 4);

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden cursor-pointer group",
        "aspect-[3/2] sm:aspect-[4/3]",
        "transition-all duration-200 hover:shadow-sm",
        className
      )}
      onClick={onOpenGallery}
    >
      {previewImages.length === 1 && <SingleImageLayout image={previewImages[0]} />}
      {previewImages.length === 2 && <DualImageLayout images={previewImages} />}
      {previewImages.length === 3 && <TrioImageLayout images={previewImages} />}
      {previewImages.length >= 4 && (
        <QuadImageLayout 
          images={previewImages} 
          remainingCount={images.length - 4} 
        />
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
    </div>
  );
};
```

---

### Step 2: Update BaseCard Component

**File**: `src/app/dashboard/notes/components/cards/BaseCard.tsx`

```tsx
// Add these imports at the top
import { useState } from 'react';
import { ImageMosaic } from '../ImageMosaic';
import { ImageGalleryModal } from '../ImageGalleryModal';

// Add this state inside the BaseCard component
export function BaseCard({
  note,
  className,
  children,
  onEdit,
  onDelete,
  onToggleImportant
}: BaseCardProps) {
  const [showImageGallery, setShowImageGallery] = useState(false);
  
  const hasImages = note.images && note.images.length > 0;

  // ... existing handlers ...

  return (
    <>
      <div
        className={cn(
          "group relative bg-background border border-border rounded-lg shadow-sm transition-all duration-200",
          "hover:shadow-md hover:border-border/60 cursor-pointer",
          className
        )}
        onClick={handleEdit}
      >
        {/* Header with actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* ... existing action buttons ... */}
        </div>

        {/* NEW: Image Mosaic Preview */}
        {hasImages && (
          <div className="p-3 pb-0">
            <ImageMosaic
              images={note.images}
              onOpenGallery={(e) => {
                e.stopPropagation(); // Prevent card click
                setShowImageGallery(true);
              }}
            />
          </div>
        )}

        {/* Card content */}
        <div className={cn("p-4", hasImages && "pt-3")}>
          {children}
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="px-4 pt-2 pb-1">
            {/* ... existing tags ... */}
          </div>
        )}

        {/* Date footer */}
        <div className="px-3 pb-2 text-xs text-muted-foreground">
          {/* ... existing date ... */}
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showImageGallery && (
        <ImageGalleryModal
          isOpen={showImageGallery}
          noteId={String(note._id)}
          images={note.images || []}
          onClose={() => setShowImageGallery(false)}
        />
      )}
    </>
  );
}
```

---

## Testing Checklist

| Task                                     | Status |
| ---------------------------------------- | ------ |
| Preview shows 1 image                    |        |
| Preview shows 2 images side by side      |        |
| Preview shows 3 in stacked layout        |        |
| Preview shows 4 with "+X more" overlay   |        |
| Clicking preview opens ImageGalleryModal |        |
| Clicking preview doesn't trigger card edit |      |
| Layout works well on mobile and desktop  |        |
| Images are lazy-loaded                   |        |
| No layout shift or broken aspect ratios  |        |
| TypeScript compiles without errors       |        |
| Proper alt text for accessibility        |        |

---

## Mobile Optimizations

* **Touch Targets**: Minimum 44px height maintained
* **Aspect Ratios**: `aspect-[3/2]` on mobile, `aspect-[4/3]` on desktop
* **Responsive Grid**: Uses existing Tailwind responsive breakpoints
* **Hover States**: Only show on devices that support hover

---

## Accessibility Considerations

* **Alt Text**: Uses `originalFilename` or `filename` as fallback
* **Keyboard Navigation**: Inherits from parent card focus behavior
* **Screen Readers**: Proper semantic structure maintained

---

## Integration Notes

* **Event Propagation**: `e.stopPropagation()` prevents mosaic click from opening card editor
* **State Management**: Uses local `useState` following existing BaseCard patterns
* **Modal Integration**: Reuses existing `ImageGalleryModal` component
* **TypeScript**: Full type safety with existing `ImageData` interface

---

## Performance Considerations

* **Lazy Loading**: All images use `loading="lazy"`
* **Key Props**: Uses `filename` for stable React keys
* **Transition Classes**: Consistent with existing component animations
* **Bundle Size**: Single file approach reduces import overhead

---

## Future Enhancements

* Replace `<img>` with Next.js `<Image>` component for optimization
* Add blurhash or shimmer placeholders
* Implement virtual scrolling for notes with many images
* Add keyboard shortcuts for gallery navigation

---