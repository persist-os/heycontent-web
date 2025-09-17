import React from 'react';
import { CodeBlock } from './CodeBlock';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  if (!content) {
    return <p className="text-muted-foreground">No content available to display</p>;
  }

  const renderLine = (line: string, index: number, lines: string[]) => {
    // Handle code blocks
    if (line.startsWith('```json')) {
      const codeContent = [];
      let endIndex = index;
      for (let j = index + 1; j < lines.length; j++) {
        if (lines[j] === '```') {
          endIndex = j;
          break;
        }
        codeContent.push(lines[j]);
      }
      // Clear processed lines
      for (let j = index + 1; j <= endIndex; j++) {
        lines[j] = '';
      }
      return <CodeBlock key={index} content={codeContent.join('\n')} />;
    }

    // Skip empty lines and processed lines
    if (line === '' || line.startsWith('```')) return null;

    // Headers
    if (line.startsWith('## ')) {
      return (
        <h2 key={index} className="text-xl font-bold mt-4 mb-2 text-foreground">
          {line.substring(3)}
        </h2>
      );
    }
    if (line.startsWith('### ')) {
      return (
        <h3 key={index} className="text-lg font-semibold mt-3 mb-2 text-foreground">
          {line.substring(4)}
        </h3>
      );
    }

    // List items
    if (line.trim().startsWith('- ')) {
      const content = line.trim().substring(2);
      return (
        <div key={index} className="flex items-start my-1">
          <span className="mr-2 mt-1 text-accent">•</span>
          <span>{content}</span>
        </div>
      );
    }

    // Bold text
    if (line.includes('**')) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={index} className="my-1">
          {parts.map((part: string, partIndex: number) =>
            partIndex % 2 === 0 ? part : <strong key={partIndex} className="font-semibold">{part}</strong>
          )}
        </p>
      );
    }

    // Regular paragraph
    return <p key={index} className="my-1">{line}</p>;
  };

  const lines = content.split('\n');
  const elements = lines.map((line, index) => renderLine(line, index, lines)).filter(Boolean);

  return <div className="markdown-content">{elements}</div>;
}
