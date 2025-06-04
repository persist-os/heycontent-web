"use client";
import React from 'react';
import { Note } from '../types';

interface NoteSidebarProps {
  note: Note;
  selectedInsight: string | null;
  setSelectedInsight: (insight: string | null) => void;
  setShowFullAnalysis: (show: boolean) => void;
}

export function NoteSidebar({
  note,
  selectedInsight,
  setSelectedInsight,
  setShowFullAnalysis
}: NoteSidebarProps) {
  // If note doesn't have platform or other metadata, we might not need to show this
  const hasMetadata = note.platform || note.postType || note.goal;
  
  if (!hasMetadata) return null;

  return (
    <div className="w-full md:w-64 lg:w-72 flex-shrink-0 border-r border-gray-200 p-4 bg-gray-50">
      <div className="space-y-4">
        {note.platform && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Platform</h3>
            <div className="text-sm bg-white p-2 rounded-md border border-gray-200">
              {note.platform}
            </div>
          </div>
        )}
        
        {note.postType && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Post Type</h3>
            <div className="text-sm bg-white p-2 rounded-md border border-gray-200">
              {note.postType}
            </div>
          </div>
        )}
        
        {note.goal && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Goal</h3>
            <div className="text-sm bg-white p-2 rounded-md border border-gray-200">
              {note.goal}
            </div>
          </div>
        )}
        
        {note.tags && note.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Tags</h3>
            <div className="flex flex-wrap gap-1">
              {note.tags.map((tag, idx) => (
                <span key={idx} className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
