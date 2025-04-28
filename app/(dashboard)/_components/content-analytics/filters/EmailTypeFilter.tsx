import React from 'react';
import type { EmailTypeFilter as EmailType } from '../types';

interface EmailTypeFilterProps {
  selectedEmailType: EmailType;
  onEmailTypeChange: (type: EmailType) => void;
}

export const EmailTypeFilter: React.FC<EmailTypeFilterProps> = ({
  selectedEmailType,
  onEmailTypeChange
}) => {
  return (
    <div className="mb-6 flex gap-2 flex-wrap">
      <button
        onClick={() => onEmailTypeChange('all')}
        className={`px-3 py-1.5 rounded-full text-sm ${
          selectedEmailType === 'all'
            ? 'bg-heycontent-purple text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      <button
        onClick={() => onEmailTypeChange('partnership')}
        className={`px-3 py-1.5 rounded-full text-sm ${
          selectedEmailType === 'partnership'
            ? 'bg-heycontent-purple text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Partnerships
      </button>
      <button
        onClick={() => onEmailTypeChange('newsletter')}
        className={`px-3 py-1.5 rounded-full text-sm ${
          selectedEmailType === 'newsletter'
            ? 'bg-heycontent-purple text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Newsletters
      </button>
      <button
        onClick={() => onEmailTypeChange('individual')}
        className={`px-3 py-1.5 rounded-full text-sm ${
          selectedEmailType === 'individual'
            ? 'bg-heycontent-purple text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Individual
      </button>
    </div>
  );
};
