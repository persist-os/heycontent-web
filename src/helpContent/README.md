# Help Modal System Documentation

## Overview

The Help Modal system provides a reusable, accessible way to guide users through features on each page of the application. It consists of:

- **HelpModal**: A carousel-style modal that displays multiple help pages
- **HelpIconButton**: A question mark icon button that triggers the modal
- **Help Content Files**: Page-specific help content that's easy to update

## 🚀 Quick Start

### 1. Basic Implementation

```tsx
import React, { useState } from "react";
import { HelpModal } from "@/components/ui/help-modal";
import { HelpIconButton } from "@/components/ui/help-icon-button";
import { contentHubHelp } from "@/helpContent";

function MyPage() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div>
      {/* Your page content */}

      {/* Help button - place in header or suitable location */}
      <HelpIconButton onClick={() => setHelpOpen(true)} />

      {/* Help modal */}
      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        pages={contentHubHelp}
        title="Page Help Guide"
      />
    </div>
  );
}
```

## 📁 File Structure

```
src/
├── components/ui/
│   ├── help-modal.tsx          # Main modal component
│   └── help-icon-button.tsx    # Question mark button
└── helpContent/
    ├── index.ts                # Exports all help content
    ├── contentHubHelp.ts       # Content Hub help pages
    ├── notesHelp.ts            # Notes page help
    ├── selfHubHelp.ts          # Self Hub help
    ├── timelineHelp.ts         # Timeline help
    ├── settingsHelp.ts         # Settings help
    └── README.md               # This file
```

## ✏️ Adding Help to a New Page

### Step 1: Create Help Content File

Create a new file in `src/helpContent/` (e.g., `newPageHelp.ts`):

```typescript
import { HelpPage } from "@/components/ui/help-modal";

export const newPageHelp: HelpPage[] = [
  {
    title: "Welcome to New Page",
    description:
      "This page helps you do amazing things.\n\n• Feature 1\n• Feature 2\n• Feature 3",
  },
  {
    title: "Getting Started",
    description: "Here's how to get started...",
    image: "/images/help/new-page-start.png", // optional
  },
  // Add more pages as needed
];
```

### Step 2: Export in Index File

Add your help content to `src/helpContent/index.ts`:

```typescript
export { newPageHelp } from "./newPageHelp";
```

### Step 3: Implement in Your Page Component

```tsx
import React, { useState } from "react";
import { HelpModal } from "@/components/ui/help-modal";
import { HelpIconButton } from "@/components/ui/help-icon-button";
import { newPageHelp } from "@/helpContent";

export default function NewPage() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div>
      {/* Your page header */}
      <div className="flex justify-between items-center">
        <h1>New Page</h1>
        <HelpIconButton onClick={() => setHelpOpen(true)} />
      </div>

      {/* Your page content */}

      {/* Help Modal */}
      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        pages={newPageHelp}
        title="New Page Guide"
      />
    </div>
  );
}
```

## 🔧 Updating Existing Help Content

### To Add a New Help Page

Edit the appropriate help file (e.g., `contentHubHelp.ts`):

```typescript
export const contentHubHelp: HelpPage[] = [
  // ... existing pages
  {
    title: "New Feature",
    description: "Description of your new feature...",
    image: "/images/help/new-feature.png", // optional
  },
];
```

### To Update Existing Content

Simply modify the existing `HelpPage` objects in the relevant file:

```typescript
{
  title: "Updated Feature Name",
  description: "Updated description with new functionality...\n\n• New bullet point\n• Another update"
}
```

## 📄 Help Page Structure

Each help page is a `HelpPage` object with these properties:

```typescript
interface HelpPage {
  title: string; // Page title (required)
  description: string; // Main content (required)
  image?: string; // Optional image path
  content?: ReactNode; // For complex JSX content (advanced)
}
```

### Content Formatting Tips

- Use `\n\n` for paragraph breaks
- Use `• ` for bullet points
- Keep descriptions concise but informative
- Use consistent formatting across all help content

### Using Images

1. Place images in `public/images/help/`
2. Reference them with absolute paths: `"/images/help/feature-screenshot.png"`
3. Images will be displayed centered and responsive

### Advanced: Custom JSX Content

For complex layouts, use the `content` property:

```typescript
{
  title: "Advanced Feature",
  description: "", // Can be empty when using content
  content: (
    <div>
      <p>Custom JSX content here</p>
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
      </ul>
    </div>
  )
}
```

## 🎨 Customization Options

### HelpIconButton Props

```typescript
interface HelpIconButtonProps {
  onClick: () => void;
  className?: string;
  size?: "sm" | "default" | "lg"; // Default: 'sm'
  variant?: "ghost" | "outline" | "secondary"; // Default: 'ghost'
}
```

Example with custom styling:

```tsx
<HelpIconButton
  onClick={() => setHelpOpen(true)}
  size="lg"
  variant="outline"
  className="text-blue-600 hover:text-blue-800"
/>
```

### HelpModal Props

```typescript
interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  pages: HelpPage[];
  title?: string; // Default: "Help Guide"
}
```

## 🎯 Best Practices

### Content Writing

1. **Start with an overview**: First page should explain what the page/feature does
2. **Be action-oriented**: Focus on what users can do, not just what exists
3. **Use progressive disclosure**: Basic concepts first, advanced features later
4. **Include examples**: Show concrete examples where helpful
5. **Keep it scannable**: Use bullet points and short paragraphs

### Implementation

1. **Consistent placement**: Place help buttons in the same relative position across pages
2. **Accessible**: The components include proper ARIA labels and keyboard navigation
3. **Mobile-friendly**: Components are responsive and touch-friendly
4. **Performance**: Help content is only loaded when imported, keeping bundles lean

### Maintenance

1. **Regular updates**: Update help content when features change
2. **User feedback**: Consider adding a feedback mechanism to help content
3. **Screenshots**: Keep screenshots current with UI changes
4. **Testing**: Test help flows on different devices and screen sizes

## 🔍 Current Implementation Status

✅ **Implemented Pages:**

- Content Hub (`ContentHubScreen.tsx`)
- Self Hub (`page.tsx`)

🚧 **Ready to Implement:**

- Notes/Smart Notes
- Timeline
- Settings

Each ready-to-implement page already has its help content file created in `src/helpContent/`.

## 🐛 Troubleshooting

### Help Button Not Showing

- Check that you've imported both components correctly
- Ensure you've added the button to your JSX
- Verify the import paths are correct

### Modal Not Opening

- Check that `helpOpen` state is being set to `true`
- Ensure `onClose` prop is correctly wired to set state to `false`
- Verify there are no console errors

### Content Not Displaying

- Check that your help content file exports the array correctly
- Ensure the import in your component is correct
- Verify the help pages array is not empty

### TypeScript Errors

- Make sure you're importing `HelpPage` type if creating new content files
- Check that all required properties (`title`, `description`) are provided
- Ensure optional properties are correctly typed

## 🔮 Future Enhancements

Potential improvements to consider:

1. **Analytics**: Track which help topics are most viewed
2. **Search**: Add search functionality within help content
3. **Interactive tours**: Highlight actual page elements
4. **Video support**: Embed video tutorials
5. **Contextual help**: Show specific help based on user state
6. **Multi-language**: Support for internationalization
7. **User contributions**: Allow users to suggest help improvements

---

**Need help with the help system?** Check the implementation examples in `ContentHubScreen.tsx` and `self-hub/page.tsx`!
