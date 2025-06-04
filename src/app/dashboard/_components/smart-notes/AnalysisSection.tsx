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
      <div className="w-full bg-white border-t border-gray-200 p-6 mt-2">
        <p className="text-gray-400 italic">Loading analysis...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white h-full overflow-auto p-6">
      <div className="markdown-content">
        {analysis && analysis.trim() ? (
          analysis.split('\n').map((line: string, i: number) => {
            if (line.startsWith('```')) {
              return <pre key={i} className="bg-gray-100 text-sm p-2 rounded my-2 overflow-x-auto">{line.replace(/```[a-z]*|```/g, '')}</pre>;
            }
            if (line.startsWith('## ')) {
              return <h2 key={i} className="text-xl font-bold mt-4 mb-2 text-purple-800">{line.substring(3)}</h2>;
            } else if (line.startsWith('### ')) {
              return <h3 key={i} className="text-lg font-semibold mt-3 mb-2 text-purple-700">{line.substring(4)}</h3>;
            } else if (line.trim().startsWith('- ')) {
              return <div key={i} className="flex items-start my-1"><span className="mr-2 mt-1 text-purple-500">•</span><span>{line.trim().substring(2)}</span></div>;
            } else {
              return <p key={i} className="my-1">{line}</p>;
            }
          })
        ) : (
          <p className="text-gray-500">No analysis available. Trigger AI analysis to see results here.</p>
        )}
      </div>
    </div>
  );
}
