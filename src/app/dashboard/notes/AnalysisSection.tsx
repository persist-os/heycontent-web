"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import React from "react";

import type { Id } from "@/convex/_generated/dataModel";

interface AnalysisSectionProps {
  noteId: Id<"notes">;
  userId: string;
}

export function AnalysisSection({ noteId, userId }: AnalysisSectionProps) {
  // Fetch analysis from Convex
  const analysis = useQuery(api.notes.getAnalysisforNote, noteId && userId ? { noteId, userId } : "skip");

  if (analysis === undefined) {
    return (
      <div className="w-full bg-background border-t border-border/40 p-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground italic">Loading analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto p-6 bg-background">
      <div className="markdown-content text-foreground max-w-none">
        {analysis && analysis.trim() ? (
          analysis.split('\n').map((line: string, i: number) => {
            if (line.startsWith('```')) {
              return (
                <pre 
                  key={i} 
                  className="bg-muted/40 text-sm p-4 rounded-lg my-4 overflow-x-auto border border-border/60 font-mono"
                >
                  <code className="text-foreground/90">{line.replace(/```[a-z]*|```/g, '')}</code>
                </pre>
              );
            }
            if (line.startsWith('## ')) {
              return (
                <h2 key={i} className="text-xl font-bold mt-8 mb-4 text-foreground pb-2 border-b border-border/40">
                  {line.substring(3)}
                </h2>
              );
            } else if (line.startsWith('### ')) {
              return (
                <h3 key={i} className="text-lg font-semibold mt-6 mb-3 text-foreground/95">
                  {line.substring(4)}
                </h3>
              );
            } else if (line.trim().startsWith('- ')) {
              return (
                <div key={i} className="flex items-start my-2 pl-2">
                  <span className="mr-3 mt-1.5 text-primary text-sm">•</span>
                  <span className="text-foreground/90 leading-relaxed">{line.trim().substring(2)}</span>
                </div>
              );
            } else if (line.trim() === '') {
              return <br key={i} />;
            } else {
              return (
                <p key={i} className="my-3 text-foreground/90 leading-relaxed">
                  {line}
                </p>
              );
            }
          })
        ) : (
          <div className="flex items-center justify-center min-h-[300px] text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-muted-foreground">
                No analysis available yet
              </p>
              <p className="text-muted-foreground/70 text-sm">
                Trigger AI analysis to see insights here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
