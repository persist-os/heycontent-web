'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Convert all variations of ~~~ delimiters to newlines
  const processedContent = content
    .replace(/~~~+/g, '\n')  // Convert any sequence of ~~~ to single newline
    .replace(/\n\n+/g, '\n\n')  // Clean up excessive newlines (max 2)
    // Add empty lines between consecutive bold labels for proper paragraph separation
    .replace(/(\*\*[^*]+:\*\*[^\n]*)\n(\*\*[^*]+:\*\*)/g, '$1\n\n$2')
    .split('\n')
    .join('\n')
    .trim();

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Paragraph styling with better spacing
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 text-sm leading-relaxed text-gray-800 dark:text-gray-200">{children}</p>
          ),
          
          // Bold text with better contrast
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
          ),
          
          // Italic text
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          
          // Unordered lists with better spacing
          ul: ({ children }) => (
            <ul className="list-disc ml-5 mb-4 space-y-1 text-sm">{children}</ul>
          ),
          
          // Ordered lists with better spacing
          ol: ({ children }) => (
            <ol className="list-decimal ml-5 mb-4 space-y-1 text-sm">{children}</ol>
          ),
          
          // List items with proper sizing
          li: ({ children }) => (
            <li className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">{children}</li>
          ),
          
          // Inline code
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-')
            
            if (isBlock) {
              return (
                <code className="block bg-gray-100 dark:bg-gray-700 rounded p-3 text-sm font-mono overflow-x-auto mb-3">
                  {children}
                </code>
              )
            }
            
            return (
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            )
          },
          
          // Code blocks
          pre: ({ children }) => (
            <pre className="bg-gray-100 dark:bg-gray-700 rounded p-3 text-sm font-mono overflow-x-auto mb-3">
              {children}
            </pre>
          ),
          
          // Headings with better spacing and styling
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-3 mt-6 first:mt-0 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-3 mt-5 first:mt-0 text-gray-900 dark:text-gray-100">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mb-2 mt-4 first:mt-0 text-gray-900 dark:text-gray-100">{children}</h3>
          ),
          
          // Links
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline text-sm" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 mb-3 text-sm">
              {children}
            </blockquote>
          ),
          
          // Horizontal rules
          hr: () => (
            <hr className="border-gray-300 dark:border-gray-600 my-4" />
          ),
          
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border border-gray-300 dark:border-gray-600 text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-700 font-semibold text-left text-sm">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm">
              {children}
            </td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
} 