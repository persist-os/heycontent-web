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
        <History className="w-8 h-8 text-gray-300 mx-auto" />
        <div>
          <p className="font-medium text-gray-900">No History</p>
          <p className="text-sm text-gray-500 mt-1">No previous persona versions found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
        {history.map((persona, index) => (
          <div key={persona._id} className="group relative flex pb-8 last:pb-0 md:flex-col md:flex-1 md:pb-0">
            {/* Connectors: Vertical for mobile, horizontal for web */}
            <div className="absolute top-3 left-3 -ml-px h-full w-px bg-gray-200 group-last:hidden md:hidden" />
            {index < history.length - 1 && (
              <div className="hidden md:block absolute top-3 left-1/2 w-full h-px bg-gray-200" />
            )}
            
            {/* Dot */}
            <div className="relative h-6 w-6 flex-none flex items-center justify-center bg-background z-10">
              <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-heycontent-purple transition-colors" />
            </div>

            {/* Content */}
            <div className="flex-grow pl-6 md:pl-0 md:pt-6">
              <div className="p-4 rounded-lg transition-colors border border-transparent group-hover:bg-gray-50/80 group-hover:border-gray-200/90 dark:group-hover:bg-gray-800/20 dark:group-hover:border-gray-700/50">

                <div className="flex items-center justify-between md:flex-col md:items-center md:text-center">
                  <p className="font-semibold text-gray-800 text-base leading-tight group-hover:text-heycontent-purple transition-colors">
                    {persona.current_name}
                  </p>
                  <Badge variant="outline" className="font-mono text-xs md:mt-2">
                    v{history.length - index}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-gray-400 font-mono md:text-center">
                  {new Date(persona.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed md:text-center">
                  {persona.current_description}
                </p>
                
                {/* Action Buttons */}
                <div className="mt-4 flex items-center gap-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 md:justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRestore(persona._id)}
                    className="w-8 h-8 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                    aria-label="Restore version"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(persona._id)}
                    className="w-8 h-8 text-gray-500 hover:bg-red-50 hover:text-red-600"
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