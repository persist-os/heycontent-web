import React from 'react';
import { RefreshCw } from 'lucide-react';

interface IdeasOverlayProps {
  show: boolean;
  text?: string;
}

const IdeasOverlay: React.FC<IdeasOverlayProps> = ({ show, text }) =>
  show ? (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <p className="flex items-center">
          <RefreshCw size={16} className="animate-spin mr-2" />
          {text || 'Applying idea to your note...'}
        </p>
      </div>
    </div>
  ) : null;

export default IdeasOverlay;
