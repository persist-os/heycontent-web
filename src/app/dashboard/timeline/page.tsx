import React from 'react';
import { TimelineScroller } from './_components';
import { NotesProvider } from '@/app/context/notes-context';

export default function TimelinePage() {
  return (
    <NotesProvider>
      <div className="h-full bg-background">
        <TimelineScroller />
      </div>
    </NotesProvider>
  );
} 