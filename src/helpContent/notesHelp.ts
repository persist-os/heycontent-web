import { HelpPage } from '@/components/ui/help-modal';

export const notesHelp: HelpPage[] = [
  {
    title: "Welcome to Smart Notes",
    description: "Smart Notes is your intelligent note-taking workspace powered by AI. Create, organize, and enhance your notes with AI assistance for maximum productivity."
  },
  {
    title: "Creating Notes",
    description: "Start creating notes instantly:\n\n• Click anywhere in the editor to start typing\n• Use keyboard shortcuts for faster formatting\n• AI will help enhance your content as you write\n• Notes are automatically saved as you type"
  },
  {
    title: "AI-Powered Features",
    description: "Enhance your notes with AI capabilities:\n\n• Auto-completion and suggestions\n• Content analysis and insights\n• Smart formatting and structure\n• Related content recommendations\n• Summary generation"
  },
  {
    title: "Keyboard Shortcuts",
    description: "Speed up your workflow with keyboard shortcuts:\n• Cmd/Ctrl + /: Toggle shortcuts help\n• Cmd/Ctrl + Z: Undo\n• Cmd/Ctrl + Y: Redo\n\nPress Cmd/Ctrl + / in the editor to see all available shortcuts."
  },
  {
    title: "Organization & Projects",
    description: "Keep your notes organized:\n\n• Create projects to group related notes\n• Use tags and categories for easy filtering\n• Search through all your notes instantly\n• Access recent notes quickly\n• Archive completed projects"
  },
  {
    title: "Analysis Types",
    description: "Different analysis modes for your content:\n\n• YouTube Analysis: Analyze video scripts and content\n• Insight Analysis: Generate insights from your notes\n• Custom Analysis: Create your own analysis frameworks\n• Collaborative Notes: Share and work together"
  }
];

// Instructions for updating this help content:
/*
TO UPDATE NOTES HELP:
1. Edit the notesHelp array above
2. Add new HelpPage objects for new features
3. Update keyboard shortcuts if they change
4. Add images for complex features if needed

Example of adding a new help page:
{
  title: "New Notes Feature",
  description: "Description of the new feature...",
  image: "/images/help/notes-feature.png" // optional
}
*/ 