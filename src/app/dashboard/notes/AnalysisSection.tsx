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
      <div className="w-full bg-background/50 border-t border-border p-6">
        <p className="text-muted-foreground/70 italic">Loading analysis...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto p-6">
      <div className="markdown-content text-foreground">
        {analysis && analysis.trim() ? (
          analysis.split('\n').map((line: string, i: number) => {
            if (line.startsWith('```')) {
              return (
                <pre 
                  key={i} 
                  className="bg-muted/50 text-sm p-4 rounded-md my-3 overflow-x-auto border border-border"
                >
                  <code>{line.replace(/```[a-z]*|```/g, '')}</code>
                </pre>
              );
            }
            if (line.startsWith('## ')) {
              return (
                <h2 key={i} className="text-xl font-bold mt-6 mb-3 text-foreground">
                  {line.substring(3)}
                </h2>
              );
            } else if (line.startsWith('### ')) {
              return (
                <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground/90">
                  {line.substring(4)}
                </h3>
              );
            } else if (line.trim().startsWith('- ')) {
              return (
                <div key={i} className="flex items-start my-1.5">
                  <span className="mr-2 mt-1.5 text-primary">•</span>
                  <span className="text-foreground/90">{line.trim().substring(2)}</span>
                </div>
              );
            } else if (line.trim() === '') {
              return <br key={i} />;
            } else {
              return (
                <p key={i} className="my-2 text-foreground/90 leading-relaxed">
                  {line}
                </p>
              );
            }
          })
        ) : (
          <p className="text-muted-foreground/80 italic">
            No analysis available. Trigger AI analysis to see results here.
          </p>
        )}
      </div>
    </div>
  );
}
