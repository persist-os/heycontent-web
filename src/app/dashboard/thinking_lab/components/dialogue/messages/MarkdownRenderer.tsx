/**
 * Markdown Renderer
 * 
 * Clean UI component for rendering markdown content.
 * Focused purely on markdown rendering without content linking concerns.
 */

'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import { LinkEmbed } from './LinkEmbed'
import type { MarkdownRendererProps } from '../../../types/components/contentRenderer'


export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Enhanced preprocessing to preserve empty lines and handle line breaks better
  const processedContent = content
    // First, preserve empty lines by replacing them with a placeholder
    .replace(/\n\s*\n/g, '\n&nbsp;\n')
    // Handle completely empty lines (just whitespace)
    .replace(/^[\s]*$/gm, '&nbsp;')
    // Convert single line breaks to double when they separate numbered items
    .replace(/(\d+\.\s[^\n]+)\n(?=\d+\.\s)/g, '$1\n\n')
    // Handle multi-line numbered items
    .replace(/(\d+\.\s[^\n]+(?:\n(?!\d+\.\s)[^\n]*)*)\n(?=\d+\.\s)/g, '$1\n\n')
    // Preserve single line breaks as proper breaks
    .replace(/(?<!\n)\n(?!\n)/g, '  \n');

  return (
    <div className={`markdown-content w-full ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Handle line breaks explicitly
          br: () => <br className="block" />,
          
          // Enhanced paragraph styling with empty paragraph support
          p: ({ children }) => {
            // Check if this is an empty paragraph (just &nbsp; or empty)
            const isEmptyParagraph = children === '&nbsp;' || 
                                   (Array.isArray(children) && children.length === 1 && children[0] === '\u00A0') ||
                                   (typeof children === 'string' && children.trim() === '') ||
                                   (Array.isArray(children) && children.every(child => 
                                     typeof child === 'string' && child.trim() === ''
                                   ));
            
            if (isEmptyParagraph) {
              return <div className="h-6 w-full" />; // Empty line with proper height
            }
            
            return (
              <p className="mb-3 last:mb-0 text-base leading-relaxed w-full break-words word-break-break-word hyphens-auto overflow-wrap-anywhere">
                {children}
              </p>
            );
          },
          
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
          
          // Underline text
          u: ({ children }) => (
            <u className="underline break-words">
              {children}
            </u>
          ),
          
          // Unordered lists with better spacing and proper wrapping
          ul: ({ children }) => (
            <ul className="list-disc ml-4 sm:ml-5 mb-4 space-y-1 w-full break-words overflow-visible">
              {children}
            </ul>
          ),
          
          // Ordered lists with better spacing and proper wrapping
          ol: ({ children }) => (
            <ol className="list-decimal ml-4 sm:ml-5 mb-4 space-y-1 w-full break-words overflow-visible">
              {children}
            </ol>
          ),
          
          // List items with proper sizing and word wrapping
          li: ({ children }) => (
            <li className="text-base leading-relaxed text-gray-800 dark:text-gray-200 w-full break-words word-break-break-word hyphens-auto whitespace-normal overflow-wrap-anywhere">
              {children}
            </li>
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
            <h1 className="text-lg font-bold mb-3 mt-6 first:mt-0 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-1 w-full break-words hyphens-auto whitespace-normal">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-3 mt-5 first:mt-0 text-gray-900 dark:text-gray-100 w-full break-words hyphens-auto whitespace-normal">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mb-2 mt-4 first:mt-0 text-gray-900 dark:text-gray-100 w-full break-words hyphens-auto whitespace-normal">{children}</h3>
          ),
          
          // Links with embed support
          a: ({ href, children }) => (
            <LinkEmbed href={href || '#'}>
              {children}
            </LinkEmbed>
          ),
          
          // Blockquotes with proper wrapping
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 mb-3 text-base w-full break-words hyphens-auto whitespace-normal">
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
