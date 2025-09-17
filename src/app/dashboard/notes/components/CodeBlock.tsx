import React from 'react';

interface CodeBlockProps {
  content: string;
  language?: string;
}

export function CodeBlock({ content, language = 'json' }: CodeBlockProps) {
  return (
    <div className="bg-muted text-foreground p-3 rounded-md my-2 overflow-x-auto border border-border">
      <pre className="text-sm">
        <code className="language-{language}">{content}</code>
      </pre>
    </div>
  );
}
