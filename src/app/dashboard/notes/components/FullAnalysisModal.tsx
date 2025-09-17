import React from 'react';
import { Brain } from 'lucide-react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { MarkdownContent } from './MarkdownContent';
import type { Note } from '../types/index';

interface FullAnalysisModalProps {
  showFullAnalysis: boolean;
  setShowFullAnalysis: (show: boolean) => void;
  selectedInsight: string | null;
}

export function FullAnalysisModal({
  showFullAnalysis,
  setShowFullAnalysis,
  selectedInsight,
}: FullAnalysisModalProps) {
  if (!showFullAnalysis || !selectedInsight) return null;

  return (
    <ModalOverlay
      isOpen={showFullAnalysis}
      onClose={() => setShowFullAnalysis(false)}
      maxWidth="max-w-4xl"
      maxHeight="max-h-[90vh]"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Brain className="w-5 h-5 text-accent" />
            Smart Note Analysis
          </h3>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <MarkdownContent content={selectedInsight} />
        </div>
        <div className="p-4 border-t border-border flex justify-end">
          <button
            onClick={() => setShowFullAnalysis(false)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
} 