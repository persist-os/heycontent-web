import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HelpPage {
  title: string;
  description: string;
  image?: string;
  content?: React.ReactNode; // For more complex content
}

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  pages: HelpPage[];
  // title?: string; // Remove this prop
}

// Component to properly render markdown-style text with formatting
function MarkdownText({ children }: { children: string }) {
  // Split text by double newlines to create paragraphs
  const paragraphs = children.split('\n\n');
  
  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, index) => {
        // Check if paragraph contains bullet points
        if (paragraph.includes('• ')) {
          const lines = paragraph.split('\n');
          const bulletItems: string[] = [];
          const nonBulletLines: string[] = [];
          
          lines.forEach(line => {
            if (line.trim().startsWith('• ')) {
              bulletItems.push(line.trim().substring(2)); // Remove bullet
            } else if (line.trim()) {
              nonBulletLines.push(line.trim());
            }
          });
          
          return (
            <div key={index} className="space-y-2">
              {nonBulletLines.length > 0 && (
                <p className="text-foreground leading-relaxed">
                  {formatInlineText(nonBulletLines.join(' '))}
                </p>
              )}
              {bulletItems.length > 0 && (
                <ul className="space-y-2 ml-4">
                  {bulletItems.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-2">
                      <span className="text-primary font-medium mt-0.5 flex-shrink-0">•</span>
                      <span className="text-foreground leading-relaxed">
                        {formatInlineText(item)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        } else {
          // Regular paragraph
          return (
            <p key={index} className="text-foreground leading-relaxed">
              {formatInlineText(paragraph.trim())}
            </p>
          );
        }
      })}
    </div>
  );
}

// Function to format inline text (bold, code, etc.)
function formatInlineText(text: string): React.ReactNode {
  // Split by bold markers (**text**)
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Bold text
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-foreground">
          {boldText}
        </strong>
      );
    } else if (part.includes('"') && (part.includes('hey content') || part.includes('update'))) {
      // Command text in quotes - style as code
      return (
        <span key={index}>
          {part.split('"').map((subPart, subIndex) => {
            if (subIndex % 2 === 1 && (subPart.includes('hey content') || subPart.includes('update'))) {
              return (
                <code key={subIndex} className="px-1.5 py-0.5 bg-muted text-foreground font-mono text-sm rounded">
                  {subPart}
                </code>
              );
            }
            return subPart;
          })}
        </span>
      );
    } else {
      return part;
    }
  });
}

export function HelpModal({ open, onClose, pages }: HelpModalProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const currentPage = pages[currentPageIndex];
  const totalPages = pages.length;
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === totalPages - 1;

  const goToNextPage = () => {
    if (!isLastPage) {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (!isFirstPage) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const goToPage = (index: number) => {
    setCurrentPageIndex(index);
  };

  // Reset to first page when modal closes/opens
  React.useEffect(() => {
    if (open) {
      setCurrentPageIndex(0);
    }
  }, [open]);

  if (!currentPage) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden bg-card border">
        <DialogTitle>
          <span className="sr-only">{currentPage.title}</span>
        </DialogTitle>
        <div className="flex flex-col space-y-6 overflow-hidden">
          {/* Page content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-4 px-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {currentPage.title}
                </h3>
                {totalPages > 1 && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {currentPageIndex + 1} of {totalPages}
                  </span>
                )}
              </div>
              
              {currentPage.image && (
                <div className="flex justify-center my-6">
                  <img
                    src={currentPage.image}
                    alt={currentPage.title}
                    className="max-w-full h-auto rounded-lg border border-border shadow-sm"
                  />
                </div>
              )}
              
              <div className="text-sm">
                {currentPage.content || (
                  <MarkdownText>{currentPage.description}</MarkdownText>
                )}
              </div>
            </div>
          </div>

          {/* Navigation controls and page indicators */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={isFirstPage}
                className={cn(
                  "flex items-center space-x-1",
                  isFirstPage && "opacity-50 cursor-not-allowed"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              {/* Page indicators */}
              <div className="flex space-x-2">
                {pages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToPage(index)}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all duration-200",
                      index === currentPageIndex
                        ? "bg-primary scale-110"
                        : "bg-muted hover:bg-muted-foreground/50 hover:scale-105"
                    )}
                    aria-label={`Go to page ${index + 1}`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={isLastPage}
                className={cn(
                  "flex items-center space-x-1",
                  isLastPage && "opacity-50 cursor-not-allowed"
                )}
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 