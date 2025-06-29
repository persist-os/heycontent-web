import React from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trash2, History } from 'lucide-react';

interface Persona {
  _id: Id<'personas'>;
  current_name: string;
  current_description: string;
  createdAt: number;
}

interface PersonaTimelineProps {
  history: Persona[];
  onRestore: (id: Id<'personas'>) => void;
  onDelete: (id: Id<'personas'>) => void;
}

export const PersonaTimeline: React.FC<PersonaTimelineProps> = ({ history, onRestore, onDelete }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-12 px-4 space-y-4">
        <History className="w-8 h-8 text-muted-foreground mx-auto" />
        <div>
          <p className="font-medium text-foreground">No History</p>
          <p className="text-sm text-muted-foreground mt-1">No previous persona versions found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
        {history.map((persona, index) => (
          <div key={persona._id} className="group relative flex pb-8 last:pb-0 md:flex-col md:flex-1 md:pb-0 md:items-center">
            {/* Connectors: Vertical for mobile, horizontal for web */}
            <div className="absolute top-3 left-3 -ml-px h-full w-px bg-purple-500 dark:bg-yellow-400 group-last:hidden md:hidden" />
            {index < history.length - 1 && (
              <div className="hidden md:block absolute top-3 left-1/2 w-full h-px bg-purple-500 dark:bg-yellow-400 -translate-x-1/2" />
            )}
            
            {/* Dot */}
            <div className="relative h-6 w-6 flex-none flex items-center justify-center bg-background z-10">
              <div className="h-2 w-2 rounded-full bg-muted-foreground group-hover:bg-purple-500 dark:group-hover:bg-yellow-400 transition-colors" />
            </div>

            {/* Content */}
            <div className="flex-grow pl-6 md:pl-0 md:pt-6">
              <div className="p-4 rounded-lg transition-colors border border-transparent group-hover:bg-muted/50 group-hover:border-border">

                <div className="flex items-center justify-between md:flex-col md:items-center md:text-center">
                  <p className="font-semibold text-foreground text-base leading-tight group-hover:text-purple-500 dark:group-hover:text-yellow-400 transition-colors">
                    {persona.current_name}
                  </p>
                  <Badge variant="outline" className="font-mono text-xs md:mt-2">
                    v{history.length - index}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground font-mono md:text-center">
                  {new Date(persona.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed md:text-center">
                  {persona.current_description}
                </p>
                
                {/* Action Buttons */}
                <div className="mt-4 flex items-center gap-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 md:justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRestore(persona._id)}
                    className="w-8 h-8 text-muted-foreground hover:bg-purple-50 hover:text-purple-500 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-400"
                    aria-label="Restore version"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(persona._id)}
                    className="w-8 h-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete version"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 