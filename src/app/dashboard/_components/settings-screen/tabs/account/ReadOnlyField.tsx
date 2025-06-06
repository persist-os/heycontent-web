import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

export const ReadOnlyField: React.FC<{
  label: string;
  value: string;
  showCopy?: boolean;
  copyText?: string;
  helperText?: string;
}> = ({ label, value, showCopy = false, copyText, helperText }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <div className="relative">
      <div className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-base border-0 min-h-[42px] flex items-center text-gray-900 dark:text-gray-100">
        {value || <span className="text-gray-400">Loading...</span>}
      </div>
      {showCopy && value && (
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={() => {
            navigator.clipboard.writeText(copyText || value);
            // You could add a toast notification here
          }}
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
    {helperText && (
      <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
    )}
  </div>
);

export const ReadOnlyTextArea: React.FC<{
  label: string;
  value: string;
  characterCount?: string;
}> = ({ label, value, characterCount }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {characterCount && (
        <span className="text-sm text-gray-500">{characterCount}</span>
      )}
    </div>
    <div className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-base border-0 min-h-[100px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
      {value || <span className="text-gray-400">Loading...</span>}
    </div>
  </div>
); 