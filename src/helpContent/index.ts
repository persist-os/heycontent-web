// Export all help content for easy importing
export { contentHubHelp } from './contentHubHelp';
export { notesHelp } from './notesHelp';
export { selfHubHelp } from './selfHubHelp';
export { settingsHelp } from './settingsHelp';
export { chatHelp } from './chatHelp';

// All help content is now casual, impactful, and TikTok-brain friendly!

// Re-export types for convenience
export type { HelpPage } from '@/components/ui/help-modal';

/*
HELP CONTENT MANAGEMENT GUIDE:

1. ADDING NEW HELP CONTENT:
   - Create a new file like 'newPageHelp.ts' in this directory
   - Export it in this index.ts file
   - Import and use it in your page component

2. UPDATING EXISTING HELP:
   - Edit the specific help file (e.g., contentHubHelp.ts)
   - No changes needed to this index.ts unless adding new files

3. HELP CONTENT STRUCTURE:
   Each help file should export an array of HelpPage objects:
   {
     title: string;        // Page title
     description: string;  // Main content (supports \n\n for paragraphs)
     image?: string;       // Optional image path
     content?: ReactNode;  // For complex JSX content
   }

4. USAGE PATTERN:
   import { HelpModal, HelpIconButton } from '@/components/ui/help-modal';
   import { contentHubHelp } from '@/helpContent';
   
   // In your component:
   const [helpOpen, setHelpOpen] = useState(false);
   
   <HelpIconButton onClick={() => setHelpOpen(true)} />
   <HelpModal 
     open={helpOpen} 
     onClose={() => setHelpOpen(false)} 
     pages={contentHubHelp}
     title="Content Hub Help"
   />
*/ 