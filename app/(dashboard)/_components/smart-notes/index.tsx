'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { FileText, Hash, AtSign, Star, Calendar,
  Image, LinkIcon, Lightbulb, MessageSquare, Clock, Keyboard } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { NoteArea } from './NoteArea';
import { ShortcutsHelp } from './ShortcutsHelp';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  important: boolean;
  type?: 'default' | 'idea';
  tags: string[];
  references: {
    type: 'ai_insight' | 'conversation' | 'idea' | 'url' | 'date';
    content: string;
    isLoading?: boolean;
  }[];
}

export default function SmartNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const data = await fetchNotes();
        setNotes(data);
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, []);

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote({
        title: 'Untitled Note',
        content: '',
        important: false,
        tags: [],
        references: []
      });

      setNotes(prev => [...prev, newNote]);
      setActiveNoteId(newNote.id);
    } catch (error: any) {
      console.error('Failed to create note:', error);
      if (error.message.includes('log in')) {
        return;
      }
    }
  };

  const handleUpdateNote = async (noteId: string, updates: Partial<Note>, shouldSync: boolean = false) => {
    try {
      // Update local state immediately
      setNotes(prev => prev.map(note => {
        if (note.id === noteId) {
          // Handle metadata updates (important, type) specially
          if ('important' in updates || 'type' in updates) {
            return {
              ...note,
              ...updates,
              updatedAt: new Date()
            };
          }
          // Handle content updates
          return { ...note, ...updates };
        }
        return note;
      }));

      // Always sync metadata changes with server
      if (shouldSync || 'important' in updates || 'type' in updates) {
        const updatedNote = await updateNote(noteId, updates);
        setNotes(prev => prev.map(note =>
          note.id === noteId ? updatedNote : note
        ));
      }
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (activeNoteId === noteId) {
        setActiveNoteId(null);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleRequestAIInsights = async (noteId: string) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;

      // Show loading state
      const loadingInsight = {
        type: 'ai_insight' as const,
        content: 'Analyzing your note content...',
        isLoading: true
      };

      // Add the loading insight to the note's references
      const referencesWithLoading = [...(note.references || []), loadingInsight];
      handleUpdateNote(noteId, { references: referencesWithLoading }, false);

      // Call the smart note analysis API
      const response = await fetch('/api/smart-note/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content_note: note.content }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Analysis failed');
      }

      // Format the analysis into a readable insight
      const analysis = data.data.analysis;
      const formattedContent = formatAnalysisToMarkdown(analysis);

      // Replace the loading insight with the actual analysis
      const updatedReferences = Array.isArray(note.references)
        ? note.references.filter(ref => !('isLoading' in ref))
        : [];
      updatedReferences.push({
        type: 'ai_insight' as const,
        content: formattedContent
      });

      // Check if we should update the title
      const updates: Partial<Note> = { references: updatedReferences };

      // If the note has the default title "Untitled Note" and we have a suggested title, update it
      if (note.title === 'Untitled Note' && data.suggestedTitle) {
        console.log(`Updating note title from "${note.title}" to "${data.suggestedTitle}"`);
        updates.title = data.suggestedTitle;
      }

      // Update the note with new references and possibly a new title
      handleUpdateNote(noteId, updates, true);
      console.log('AI insights generated successfully');
    } catch (error) {
      console.error('Failed to generate AI insights:', error);

      // Remove the loading insight and add an error message
      const note = notes.find(n => n.id === noteId);
      if (note) {
        const updatedReferences = Array.isArray(note.references)
          ? note.references.filter(ref => !('isLoading' in ref))
          : [];
        updatedReferences.push({
          type: 'ai_insight' as const,
          content: `Error analyzing note: ${error instanceof Error ? error.message : 'Unknown error'}`
        });

        handleUpdateNote(noteId, { references: updatedReferences }, true);
      }
    }
  };

  // Helper function to format the analysis into markdown
  const formatAnalysisToMarkdown = (analysis: any): string => {
    try {
      if (!analysis) return 'No analysis available';

      // Content Strategy section
      const contentStrategy = `## Content Strategy Analysis

### Overview
- **Category:** ${analysis.contentStrategy?.overview?.category || 'N/A'}
- **Core Idea:** ${analysis.contentStrategy?.overview?.coreIdea || 'N/A'}
- **Content Type:** ${analysis.contentStrategy?.overview?.contentType || 'N/A'}
- **Stage:** ${analysis.contentStrategy?.overview?.stage || 'N/A'}

### Target Audience
- **Demographics:** ${analysis.contentStrategy?.marketAnalysis?.audience?.demographics || 'N/A'}
- **Interests:** ${analysis.contentStrategy?.marketAnalysis?.audience?.interests || 'N/A'}
- **Psychographics:** ${analysis.contentStrategy?.marketAnalysis?.audience?.psychographics || 'N/A'}

### Competition
- **Direct:** ${analysis.contentStrategy?.marketAnalysis?.competition?.direct || 'N/A'}
- **Indirect:** ${analysis.contentStrategy?.marketAnalysis?.competition?.indirect || 'N/A'}
- **Analysis:** ${analysis.contentStrategy?.marketAnalysis?.competition?.analysis || 'N/A'}`;

      // Platform Strategy section
      const platformsMarkdown = (analysis.platformStrategy?.platforms || []).map((p: any) =>
        `- **${p.name}:** ${p.rationale}`
      ).join('\n');

      const platformStrategy = `## Platform Strategy

### Recommended Platforms
${platformsMarkdown || 'No platform recommendations available'}

### Posting Schedule
${Object.entries(analysis.platformStrategy?.timing || {}).map(([platform, data]: [string, any]) =>
  `- **${platform}:** ${data.postingSchedule} - ${data.analysis}`
).join('\n') || 'No posting schedule available'}`;

      // Production Plan section
      const productionPlan = `## Production Plan

### Resources
- **Equipment:** ${analysis.productionPlan?.resources?.equipment || 'N/A'}
- **Software:** ${analysis.productionPlan?.resources?.software || 'N/A'}
- **Props:** ${analysis.productionPlan?.resources?.props || 'N/A'}
- **Budget:** ${analysis.productionPlan?.resources?.budget || 'N/A'}

### Timeline
${Object.entries(analysis.productionPlan?.timeline || {}).map(([phase, data]: [string, any]) =>
  `- **${phase}:** ${data.duration} - ${data.goals}`
).join('\n') || 'No timeline available'}`;

      // Growth Strategy section
      const monetizationOptions = (analysis.growthStrategy?.monetization?.options || []).map((option: string) =>
        `- ${option}`
      ).join('\n');

      const growthTactics = (analysis.growthStrategy?.audience?.growthTactics || []).map((tactic: string) =>
        `- ${tactic}`
      ).join('\n');

      const growthStrategy = `## Growth Strategy

### Monetization Options
${monetizationOptions || 'No monetization options available'}

### Audience Growth Tactics
${growthTactics || 'No growth tactics available'}

### Projections
- **Followers (Month 1):** ${analysis.growthStrategy?.projections?.followers?.month1 || 'N/A'}
- **Followers (Month 6):** ${analysis.growthStrategy?.projections?.followers?.month6 || 'N/A'}
- **Revenue (Year 1):** ${analysis.growthStrategy?.projections?.revenue?.year1 || 'N/A'}`;

      // Recommendations section
      const immediateRecs = (analysis.recommendations?.immediate || []).map((rec: string) =>
        `- ${rec}`
      ).join('\n');

      const shortTermRecs = (analysis.recommendations?.shortTerm || []).map((rec: string) =>
        `- ${rec}`
      ).join('\n');

      const recommendations = `## Recommendations

### Immediate Actions
${immediateRecs || 'No immediate recommendations available'}

### Short-Term Actions
${shortTermRecs || 'No short-term recommendations available'}`;

      // Combine all sections
      return `${contentStrategy}\n\n${platformStrategy}\n\n${productionPlan}\n\n${growthStrategy}\n\n${recommendations}`;
    } catch (error) {
      console.error('Error formatting analysis:', error);
      // Fallback to raw JSON if rendering fails
      return `## Analysis Results (Raw Data)
\`\`\`json\n${JSON.stringify(analysis, null, 2)}\n\`\`\``;
    }
  };

  const activeNote = notes.find(note => note.id === activeNoteId);

  const fetchNotes = async () => {
    // First try to get from API
    try {
      const response = await fetch('/api/notes');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('API fetch failed, using mock data:', error);
    }

    // Fallback to mock data
    return [
      {
        id: '1',
        title: 'Welcome to Smart Notes',
        content: '# Getting Started\n\nSmart Notes helps you organize your thoughts and ideas. Here are some features:\n\n- Markdown formatting\n- Tag organization with #tags\n- AI-powered insights\n\n## Tips\n\nUse the / command to access the command menu.',
        createdAt: new Date(),
        updatedAt: new Date(),
        important: true,
        type: 'default',
        tags: ['welcome'],
        references: [
          {
            type: 'ai_insight',
            content: 'Try using headers to organize your notes better.'
          }
        ]
      },
      {
        id: '2',
        title: 'Content Strategy Ideas',
        content: '# Content Strategy Ideas\n\n## Social Media\n- Post 3x per week on LinkedIn\n- Create more video content\n- Engage with industry leaders\n\n## Blog\n- Write long-form tutorials\n- Update old posts\n- Focus on SEO optimization\n\n#content #strategy #ideas',
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
        important: true,
        type: 'idea',
        tags: ['content', 'strategy', 'ideas'],
        references: [
          {
            type: 'ai_insight',
            content: 'Based on your audience analysis, video content performs 40% better than text-only posts.'
          }
        ]
      },
      {
        id: '3',
        title: 'Meeting Notes',
        content: '# Team Meeting - April 5\n\n## Attendees\n- Sarah (Marketing)\n- John (Product)\n- Maya (Design)\n\n## Action Items\n- Update product roadmap by Friday\n- Schedule user testing sessions\n- Finalize Q2 marketing calendar\n\n#meeting #team',
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 172800000),
        important: false,
        type: 'default',
        tags: ['meeting', 'team'],
        references: []
      }
    ];
  };

  const createNote = async (note: Partial<Note>) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create note:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });

        if (response.status === 401) {
          window.location.href = '/login';
          throw new Error('Please log in to create notes');
        }

        throw new Error(errorData.details || 'Failed to create note');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Create note error:', error);
      // Fallback for demo: create a local note
      return {
        id: `temp_${Date.now()}`,
        title: note.title || 'Untitled Note',
        content: note.content || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        important: note.important || false,
        type: note.type || 'default',
        tags: note.tags || [],
        references: note.references || []
      };
    }
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update note');
      return response.json();
    } catch (error) {
      console.error('Update note error:', error);
      // Fallback for demo: update local note
      const note = notes.find(n => n.id === noteId);
      if (!note) throw new Error('Note not found');
      return {
        ...note,
        ...updates,
        updatedAt: new Date()
      };
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white/70 backdrop-blur-sm rounded-3xl overflow-hidden">
      <Sidebar
        notes={notes}
        activeNoteId={activeNoteId}
        onNoteSelect={setActiveNoteId}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
      />

      {activeNote ? (
        <div className="flex-1 relative">
          <NoteArea
            note={activeNote}
            onUpdate={(noteId, updates) => handleUpdateNote(noteId, updates, false)}
            onSave={() => activeNote && handleUpdateNote(activeNote.id, {}, true)}
            onToggleShortcuts={() => setShowShortcuts(!showShortcuts)}
            onRequestAIInsights={handleRequestAIInsights}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a note or create a new one
        </div>
      )}

      {showShortcuts && (
        <ShortcutsHelp onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
}