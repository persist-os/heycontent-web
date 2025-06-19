import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';

interface PersonaHistoryItemProps {
  persona: {
    _id: Id<"personas">;
    current_name: string;
    current_description: string;
    createdAt: number;
  };
  version: number;
  onRestore: (id: Id<"personas">) => void;
  onDelete: (id: Id<"personas">) => void;
}

export const PersonaHistoryItem: React.FC<PersonaHistoryItemProps> = ({
  persona,
  version,
  onRestore,
  onDelete
}) => {
  return (
    <div className="group flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <p className="font-medium text-gray-900 truncate">
            {persona.current_name}
          </p>
          <Badge variant="outline" className="text-xs">
            v{version}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 mb-1">
          {persona.current_description}
        </p>
        <p className="text-xs text-gray-400">
          {new Date(persona.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRestore(persona._id)}
          className="text-blue-600 hover:text-blue-700"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(persona._id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}; 