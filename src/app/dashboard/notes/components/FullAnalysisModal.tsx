import React from 'react';
import { Brain, X } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Smart Note Analysis
          </h3>
          <button
            onClick={() => setShowFullAnalysis(false)}
            className="p-1 rounded-full hover:bg-gray-100"
            title="Close analysis"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="markdown-content">
            {selectedInsight ? (
              selectedInsight?.split('\n')?.map((line: string, i: number, arr: string[]) => {
                if (line.startsWith('```json')) {
                  const codeContent = [];
                  let endIndex = i;
                  for (let j = i + 1; j < arr.length; j++) {
                    if (arr[j] === '```') {
                      endIndex = j;
                      break;
                    }
                    codeContent.push(arr[j]);
                  }
                  for (let j = i + 1; j <= endIndex; j++) {
                    arr[j] = '';
                  }
                  return (
                    <div key={i} className="bg-gray-800 text-white p-3 rounded-md my-2 overflow-x-auto">
                      <pre className="text-sm">{codeContent.join('\n')}</pre>
                    </div>
                  );
                }
                if (line === '') return null;
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-xl font-bold mt-4 mb-2 text-purple-800">{line.substring(3)}</h2>;
                } else if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-lg font-semibold mt-3 mb-2 text-purple-700">{line.substring(4)}</h3>;
                } else if (line.trim().startsWith('- ')) {
                  const content = line.trim().substring(2);
                  return (
                    <div key={i} className="flex items-start my-1">
                      <span className="mr-2 mt-1 text-purple-500">•</span>
                      <span>{content}</span>
                    </div>
                  );
                } else if (line.includes('**')) {
                  const parts = line.split(/\*\*(.*?)\*\*/g);
                  return (
                    <p key={i} className="my-1">
                      {parts.map((part: string, partIndex: number) => {
                        return partIndex % 2 === 0 ?
                          part :
                          <strong key={partIndex} className="font-semibold">{part}</strong>;
                      })}
                    </p>
                  );
                } else {
                  return <p key={i} className="my-1">{line}</p>;
                }
              }).filter(Boolean)
            ) : (
              <p className="text-gray-500">No content available to display</p>
            )}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={() => setShowFullAnalysis(false)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 