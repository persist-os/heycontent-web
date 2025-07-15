// OLD HELP CONTENT REMOVED - Now using interactive tours system
// See /helpContent/interactiveTours.tsx for the new tour system

// Re-export types for convenience
export type { HelpPage } from '@/components/ui/help-modal';

/*
HELP CONTENT MANAGEMENT GUIDE:

1. ADDING NEW HELP CONTENT:
   - Create a new file like 'newPageHelp.ts' in this directory
   - Export it in this index.ts file
   - Import and use it in your page component

2. NEW INTERACTIVE TOUR SYSTEM:
   - All help content now uses interactive tours instead of modals
   - Edit tours in /helpContent/interactiveTours.tsx or specific tour files
   - Tours provide step-by-step guidance with contextual positioning

3. INTERACTIVE TOUR STRUCTURE:
   Each tour consists of InteractiveStep objects:
   {
     target: string;       // CSS selector for element to highlight
     title: string;        // Step title
     content: string;      // Step description
     placement?: string;   // Tooltip placement (top, bottom, left, right)
     action?: () => void;  // Optional action to perform
   }

4. USAGE PATTERN (NEW INTERACTIVE TOUR SYSTEM):
   import { InteractiveTooltip } from '@/components/ui/interactive-tooltip';
   import { interactiveTours } from '@/helpContent/interactiveTours';
   
   // In your component:
   const [tourOpen, setTourOpen] = useState(false);
   
   <InteractiveTooltip
     isOpen={tourOpen}
     onClose={() => setTourOpen(false)}
     steps={interactiveTours.notes}
     title="Notes Tour"
     autoPlay={false}
   />
*/ 