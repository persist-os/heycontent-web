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
    <div className={`markdown-content w-full ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Paragraph styling with better spacing and proper word wrapping
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 text-base leading-relaxed w-full break-words hyphens-auto">
              {children}
            </p>
          ),
          
          // Bold text
          strong: ({ children }) => (
            <strong className="font-semibold break-words">
              {children}
            </strong>
          ),
          
          // Italic text
          em: ({ children }) => (
            <em className="italic break-words">
              {children}
            </em>
          ),
          
          // Unordered lists with better spacing and proper wrapping
          ul: ({ children }) => (
            <ul className="list-disc ml-5 mb-4 space-y-1 w-full">
              {children}
            </ul>
          ),
          
          // Ordered lists with better spacing and proper wrapping
          ol: ({ children }) => (
            <ol className="list-decimal ml-5 mb-4 space-y-1 w-full">
              {children}
            </ol>
          ),
          
          // List items with proper sizing and word wrapping
          li: ({ children }) => (
            <li className="text-base leading-relaxed text-gray-800 dark:text-gray-200 w-full break-words hyphens-auto">{children}</li>
          ),
          
          // Inline code
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-')
            
            if (isBlock) {
              return (
                <code className="block bg-gray-100 dark:bg-gray-700 rounded p-3 text-base font-mono overflow-x-auto mb-3 w-full break-words">
                  {children}
                </code>
              )
            }
            
            return (
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-base font-mono break-words">
                {children}
              </code>
            )
          },
          
          // Code blocks with full width and proper overflow handling
          pre: ({ children }) => (
            <pre className="bg-gray-100 dark:bg-gray-700 rounded p-3 text-base font-mono overflow-x-auto mb-3 w-full break-words whitespace-pre-wrap">
              {children}
            </pre>
          ),
          
          // Headings with better spacing and proper wrapping
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-3 mt-6 first:mt-0 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-1 w-full break-words hyphens-auto">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-3 mt-5 first:mt-0 text-gray-900 dark:text-gray-100 w-full break-words hyphens-auto">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mb-2 mt-4 first:mt-0 text-gray-900 dark:text-gray-100 w-full break-words hyphens-auto">{children}</h3>
          ),
          
          // Links with proper wrapping
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline text-base break-words" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          
          // Blockquotes with proper wrapping
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 mb-3 text-base w-full break-words hyphens-auto">
              {children}
            </blockquote>
          ),
          
          // Horizontal rules
          hr: () => (
            <hr className="border-gray-300 dark:border-gray-600 my-4 w-full" />
          ),
          
          // Tables with proper overflow handling
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3 w-full">
              <table className="min-w-full border border-gray-300 dark:border-gray-600 text-base w-full">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-700 font-semibold text-left text-base break-words">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-base break-words">
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