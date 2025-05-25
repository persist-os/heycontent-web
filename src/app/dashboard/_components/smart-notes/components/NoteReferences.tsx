"use client";

import React from 'react';
import { Brain, MessageSquare, Lightbulb, ExternalLink } from 'lucide-react';
import type { Note } from '../types/index';

interface NoteReferencesProps {
  references: Note['references'];
  selectedInsight: string | null;
  setSelectedInsight: (insight: string | null) => void;
  setShowFullAnalysis: (show: boolean) => void;
}

export function NoteReferences({ 
  references, 
  selectedInsight, 
  setSelectedInsight, 
  setShowFullAnalysis 
}: NoteReferencesProps) {
  if (references.length === 0) return null;

  return (
    <div className="rounded-lg bg-purple-50 p-4 space-y-4 mb-6">
      <h3 className="font-medium text-purple-800">Insights & References</h3>
      {references.map((ref, index) => (
        <div
          key={index}
          className={`p-3 rounded-lg ${
            ref.type === 'ai_insight' ? 'bg-purple-100' :
            ref.type === 'conversation' ? 'bg-blue-50 border-l-4 border-blue-500' :
            ref.type === 'idea' ? 'bg-yellow-50 border-l-4 border-yellow-500' : 'bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium mb-1 text-gray-700">
            {ref.type === 'ai_insight' && <Brain className="w-4 h-4 text-purple-600" />}
            {ref.type === 'conversation' && <MessageSquare className="w-4 h-4 text-blue-600" />}
            {ref.type === 'idea' && <Lightbulb className="w-4 h-4 text-yellow-600" />}
            {ref.type === 'ai_insight' ? 'AI Insight' :
              ref.type === 'conversation' ? 'Conversation' :
              ref.type === 'idea' ? 'Idea' : 'Reference'}
            {ref.isLoading && <span className="ml-2 inline-block animate-pulse text-purple-600">Analyzing...</span>}
          </div>
          {ref.isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-purple-300 animate-pulse"></div>
              <div className="w-4 h-4 rounded-full bg-purple-400 animate-pulse delay-150"></div>
              <div className="w-4 h-4 rounded-full bg-purple-500 animate-pulse delay-300"></div>
              <p className="text-gray-500 ml-2">Analyzing your note with SmartNoteGemini...</p>
            </div>
          ) : (
            <div className="text-gray-700 whitespace-pre-line overflow-auto">
              {ref.content && (ref.content.includes('##') || ref.content.includes('```')) ? (
                <>
                  <div className="markdown-content max-h-[400px] overflow-y-auto mb-2">
                    {ref.content.split('\n').map((line: string, i: number, arr: string[]) => {
                      if (line.startsWith('```json')) {
                        let codeContent = [];
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
                    }).filter(Boolean)}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedInsight(ref.content);
                      setShowFullAnalysis(true);
                    }}
                    className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 mt-2"
                  >
                    <ExternalLink size={14} />
                    View Full Analysis
                  </button>
                </>
              ) : (
                ref.content
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 