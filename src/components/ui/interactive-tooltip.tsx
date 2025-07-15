import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export interface InteractiveStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for the element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  delay?: number; // Delay before showing this step (ms)
  action?: 'hover' | 'click' | 'focus' | 'none' | 'navigate';
  content?: React.ReactNode; // Custom content for complex explanations
  image?: string; // Optional image/gif for the step
  // Navigation properties
  navigateTo?: string; // Path to navigate to before highlighting element
  waitForNavigation?: boolean; // Whether to wait for page load after navigation
  navigationDelay?: number; // Delay after navigation before highlighting element
  fallbackContent?: React.ReactNode; // Content to show if element not found
  condition?: () => boolean; // Condition to check before showing step
  // Demo automation
  automateMessage?: string; // Message to send automatically for demo purposes
  automateDelay?: number; // Delay before sending automated message
}

export interface InteractiveTooltipProps {
  isOpen: boolean;
  onClose: () => void;
  steps: InteractiveStep[];
  title: string;
  description?: string;
  autoPlay?: boolean;
  className?: string;
}

export function InteractiveTooltip({
  isOpen,
  onClose,
  steps,
  title,
  description,
  autoPlay = false,
  className
}: InteractiveTooltipProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [elementFound, setElementFound] = useState(false);
  const [debugMessage, setDebugMessage] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const findElementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const currentStepData = steps[currentStep];

  // Set up portal container
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let container = document.getElementById('tooltip-portal');
      if (!container) {
        container = document.createElement('div');
        container.id = 'tooltip-portal';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.zIndex = '999999';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
      }
      setPortalContainer(container);
    }
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && elementFound && !isNavigating) {
      const timer = setTimeout(() => {
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
            setIsPlaying(false);
        }
      }, 3000);
      return () => clearTimeout(timer);
      }
  }, [isPlaying, elementFound, currentStep, steps.length, isNavigating]);

  // Handle navigation for steps
  useEffect(() => {
    if (!isOpen || !currentStepData) return;

    const handleNavigation = async () => {
      // Check condition first
      if (currentStepData.condition && !currentStepData.condition()) {
        setShowFallback(true);
        setElementFound(true);
        // Add top margin to avoid browser UI overlap
        setTooltipPosition({ 
          x: window.innerWidth / 2, 
          y: Math.max(window.innerHeight / 2, 200) // Ensure at least 200px from top
        });
        return;
      }

      // If step requires navigation
      if (currentStepData.navigateTo) {
        const currentPath = window.location.pathname;
        const targetPath = currentStepData.navigateTo;
        
        // Validate that the target path looks like a valid internal route
        if (!targetPath.startsWith('/') || targetPath.includes('://')) {
          console.warn(`Invalid navigation target: ${targetPath}. Skipping navigation.`);
          setShowFallback(true);
          setElementFound(true);
          // Add top margin to avoid browser UI overlap
          setTooltipPosition({ 
            x: window.innerWidth / 2, 
            y: Math.max(window.innerHeight / 2, 200) // Ensure at least 200px from top
          });
          return;
        }
          
        // Only navigate if we're not already on the target page
        if (currentPath !== targetPath) {
          setIsNavigating(true);
          setHighlightedElement(null);
          setElementFound(false);
          setShowFallback(false);

          try {
            // Navigate to the required page
            router.push(targetPath);

            // Wait for navigation to complete with adaptive timing
            const navigationDelay = currentStepData.navigationDelay || 1500;
            await new Promise(resolve => setTimeout(resolve, navigationDelay));
          
            // Additional wait for page to fully load with timeout
            await new Promise((resolve, reject) => {
              let attempts = 0;
              const maxAttempts = 50; // 5 seconds max
              
              const checkPageLoad = () => {
                attempts++;
                const isCorrectPath = window.location.pathname === targetPath;
                const isLoaded = document.readyState === 'complete';
          
                if (isCorrectPath && isLoaded) {
                  resolve(undefined);
                } else if (attempts >= maxAttempts) {
                  console.warn(`Navigation timeout for ${targetPath}. Current path: ${window.location.pathname}`);
                  reject(new Error('Navigation timeout'));
                } else {
                  setTimeout(checkPageLoad, 100);
                }
              };
              checkPageLoad();
            });

            setIsNavigating(false);
          } catch (error) {
            console.error('Navigation error:', error);
            setIsNavigating(false);
            // Show fallback content instead of failing
            setShowFallback(true);
            setElementFound(true);
            // Add top margin to avoid browser UI overlap
            setTooltipPosition({ 
              x: window.innerWidth / 2, 
              y: Math.max(window.innerHeight / 2, 200) // Ensure at least 200px from top
            });
            return;
          }
        }
      }

      // After navigation (or if no navigation), find the element
      if (currentStepData.target) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          findAndHighlightElement();
        }, 200);
      } else {
        // No target element, show centered tooltip
        setElementFound(true);
        setHighlightedElement(null);
        // Add top margin to avoid browser UI overlap
        setTooltipPosition({ 
          x: window.innerWidth / 2, 
          y: Math.max(window.innerHeight / 2, 200) // Ensure at least 200px from top
        });
      }

      // Handle message automation if specified
      if (currentStepData.automateMessage) {
        const automationDelay = currentStepData.automateDelay || 1000;
        setTimeout(() => {
          // Try to find and populate the chat input
          const chatInput = document.querySelector('[data-chat-input]') as HTMLTextAreaElement;
          if (chatInput) {
            // Set the value directly
            chatInput.value = currentStepData.automateMessage!;
            
            // Focus the input
            chatInput.focus();
            
            // Create and dispatch input event to trigger React state updates
            const inputEvent = new Event('input', { 
              bubbles: true, 
              cancelable: true 
            });

            // Set the descriptor to make React recognize the change
            const inputDescriptor = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype, 
              'value'
            );
            if (inputDescriptor?.set) {
              inputDescriptor.set.call(chatInput, currentStepData.automateMessage!);
            }
            
            // Dispatch the input event
            chatInput.dispatchEvent(inputEvent);
            
            // Also dispatch a change event for good measure
            const changeEvent = new Event('change', { 
              bubbles: true, 
              cancelable: true 
            });
            chatInput.dispatchEvent(changeEvent);
            
            // Note: Removed auto-submit - user will send manually
          }
        }, automationDelay);
      }
    };

    handleNavigation();
  }, [currentStep, isOpen, currentStepData, router]);

  // Find and highlight element
  const findAndHighlightElement = useCallback(() => {
    if (!currentStepData?.target) return;

    let attempts = 0;
    const maxAttempts = 30; // 30 attempts over 3 seconds

    const findElement = () => {
      const element = document.querySelector(currentStepData.target!) as HTMLElement;
      attempts++;
      
      if (element) {
        // Check if element is actually visible - be more lenient
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        
        // More lenient visibility check - element just needs to exist and have dimensions
        const isPartiallyVisible = isVisible && (
          rect.top < window.innerHeight && rect.bottom > 0 &&
          rect.left < window.innerWidth && rect.right > 0
        );
        
        if (isPartiallyVisible || attempts > maxAttempts / 3) { // Accept even less strict visibility sooner
          setHighlightedElement(element);
          setElementFound(true);
          setShowFallback(false);
          setDebugMessage('');
          
          // Clean up intervals
          if (findElementTimeoutRef.current) {
            clearTimeout(findElementTimeoutRef.current);
          }
          return true;
        }
      }

        setElementFound(false);
        setHighlightedElement(null);
      setDebugMessage(`Looking for: ${currentStepData.target} (${attempts}/${maxAttempts})`);

      // Show fallback after max attempts
      if (attempts >= maxAttempts) {
        if (currentStepData.fallbackContent) {
          setShowFallback(true);
          setElementFound(true);
      setTooltipPosition({ 
        x: window.innerWidth / 2, 
        y: window.innerHeight / 2 
      });
        }
        return true;
    }
      
      return false;
    };

    const searchInterval = setInterval(() => {
      if (findElement()) {
        clearInterval(searchInterval);
      }
    }, 100);

    // Cleanup after max time
      findElementTimeoutRef.current = setTimeout(() => {
      clearInterval(searchInterval);
    }, 3000);

    // Initial attempt
    findElement();

    return () => {
      clearInterval(searchInterval);
      if (findElementTimeoutRef.current) {
        clearTimeout(findElementTimeoutRef.current);
      }
    };
  }, [currentStepData]);

  // Handle element positioning
  const handleElementPosition = useCallback(() => {
    if (!highlightedElement || !currentStepData) return;

    // Scroll element into view if needed
    highlightedElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'center'
    });

    // Wait a bit for scroll to complete
    setTimeout(() => {
      const rect = highlightedElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Tooltip dimensions
      const tooltipWidth = 320;
      const tooltipHeight = 250; // Estimated height
      const minDistance = 80; // Increased minimum distance from target element
      
      // Calculate element bounds with padding
      const elementBounds = {
        left: rect.left - minDistance,
        right: rect.right + minDistance,
        top: rect.top - minDistance,
        bottom: rect.bottom + minDistance
      };

      // Default to center of screen (with top margin to avoid browser UI)
      let tooltipX = viewportWidth / 2;
      let tooltipY = (viewportHeight + 120) / 2; // Offset center down to avoid browser UI

      // Try to position based on preferred position, avoiding overlap
      const elementCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      // Calculate safe positions for each direction
      const positions = {
        top: {
          x: elementCenter.x,
          y: rect.top - tooltipHeight / 2 - minDistance,
          priority: currentStepData.position === 'top' ? 1 : 3
        },
        bottom: {
          x: elementCenter.x,
          y: rect.bottom + tooltipHeight / 2 + minDistance,
          priority: currentStepData.position === 'bottom' ? 1 : 3
        },
        left: {
          x: rect.left - tooltipWidth / 2 - minDistance,
          y: elementCenter.y,
          priority: currentStepData.position === 'left' ? 1 : 2
        },
        right: {
          x: rect.right + tooltipWidth / 2 + minDistance,
          y: elementCenter.y,
          priority: currentStepData.position === 'right' ? 1 : 2
        }
      };

      // Check which positions are valid (within viewport)
      // Add extra top margin to avoid browser UI overlap
      const topMargin = 120; // Increased from 50 to avoid browser UI
      const sideMargin = 50;
      const bottomMargin = 50;
      
      const validPositions = Object.entries(positions).filter(([_, pos]) => {
        return pos.x - tooltipWidth / 2 > sideMargin && 
               pos.x + tooltipWidth / 2 < viewportWidth - sideMargin &&
               pos.y - tooltipHeight / 2 > topMargin && 
               pos.y + tooltipHeight / 2 < viewportHeight - bottomMargin;
      });

      // Sort by priority and use the best valid position
      if (validPositions.length > 0) {
        validPositions.sort((a, b) => a[1].priority - b[1].priority);
        const bestPosition = validPositions[0][1];
        tooltipX = bestPosition.x;
        tooltipY = bestPosition.y;
      } else {
        // If no position works perfectly, find the safest fallback
        // Position to the side with most space
        const leftSpace = rect.left;
        const rightSpace = viewportWidth - rect.right;
        const topSpace = rect.top;
        const bottomSpace = viewportHeight - rect.bottom;
        
        if (rightSpace > leftSpace && rightSpace > tooltipWidth / 2 + 100) {
          // Position to the right
          tooltipX = Math.min(rect.right + tooltipWidth / 2 + minDistance, viewportWidth - tooltipWidth / 2 - sideMargin);
          tooltipY = Math.max(tooltipHeight / 2 + topMargin, Math.min(elementCenter.y, viewportHeight - tooltipHeight / 2 - bottomMargin));
        } else if (leftSpace > tooltipWidth / 2 + 100) {
          // Position to the left
          tooltipX = Math.max(rect.left - tooltipWidth / 2 - minDistance, tooltipWidth / 2 + sideMargin);
          tooltipY = Math.max(tooltipHeight / 2 + topMargin, Math.min(elementCenter.y, viewportHeight - tooltipHeight / 2 - bottomMargin));
        } else if (bottomSpace > topSpace && bottomSpace > tooltipHeight / 2 + 100) {
          // Position below
          tooltipX = Math.max(tooltipWidth / 2 + sideMargin, Math.min(elementCenter.x, viewportWidth - tooltipWidth / 2 - sideMargin));
          tooltipY = Math.min(rect.bottom + tooltipHeight / 2 + minDistance, viewportHeight - tooltipHeight / 2 - bottomMargin);
        } else {
          // Position above
          tooltipX = Math.max(tooltipWidth / 2 + sideMargin, Math.min(elementCenter.x, viewportWidth - tooltipWidth / 2 - sideMargin));
          tooltipY = Math.max(rect.top - tooltipHeight / 2 - minDistance, tooltipHeight / 2 + topMargin);
        }
      }

      // Final safety bounds
      tooltipX = Math.max(tooltipWidth / 2 + sideMargin, Math.min(tooltipX, viewportWidth - tooltipWidth / 2 - sideMargin));
      tooltipY = Math.max(tooltipHeight / 2 + topMargin, Math.min(tooltipY, viewportHeight - tooltipHeight / 2 - bottomMargin));

      setTooltipPosition({ x: tooltipX, y: tooltipY });

      // Add highlight styles
      highlightedElement.style.position = 'relative';
      highlightedElement.style.zIndex = '999998';
      highlightedElement.style.boxShadow = '0 0 0 3px rgba(147, 51, 234, 0.4), 0 0 0 6px rgba(147, 51, 234, 0.2), 0 0 20px rgba(147, 51, 234, 0.3)';
      highlightedElement.style.borderRadius = '8px';
      highlightedElement.style.transition = 'all 0.3s ease';
      highlightedElement.style.transform = 'scale(1.02)';

      // Store original styles for cleanup
      const originalStyles = {
        position: highlightedElement.style.position,
        zIndex: highlightedElement.style.zIndex,
        boxShadow: highlightedElement.style.boxShadow,
        borderRadius: highlightedElement.style.borderRadius,
        transition: highlightedElement.style.transition,
        transform: highlightedElement.style.transform
      };

      return () => {
        if (highlightedElement) {
          Object.assign(highlightedElement.style, originalStyles);
        }
      };
    }, 300);
  }, [highlightedElement, currentStepData]);

  // Position tooltip when element is found
  useEffect(() => {
    if (elementFound && highlightedElement) {
      return handleElementPosition();
    }
  }, [elementFound, highlightedElement, handleElementPosition]);

  // Handle step actions
  useEffect(() => {
    if (!highlightedElement || !currentStepData?.action || currentStepData.action === 'none' || currentStepData.action === 'navigate') {
      return;
    }

    const handleAction = () => {
      switch (currentStepData.action) {
        case 'hover':
          highlightedElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
          break;
        case 'click':
          highlightedElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          break;
        case 'focus':
          if (highlightedElement instanceof HTMLInputElement || highlightedElement instanceof HTMLTextAreaElement) {
            highlightedElement.focus();
          }
          break;
      }
    };

    const timer = setTimeout(handleAction, currentStepData.delay || 1000);
    return () => clearTimeout(timer);
  }, [highlightedElement, currentStepData]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setIsPlaying(false);
  };

  if (!isOpen) return null;

  const tooltipContent = (
    <div className="fixed inset-0 z-[999999] pointer-events-none">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/10 backdrop-blur-[0.5px] z-[999998] pointer-events-auto"
        onClick={onClose}
      />

      {/* Navigation indicator */}
      {isNavigating && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[999999] pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 p-6 flex items-center gap-3 min-w-[280px]">
            <div className="relative">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-200 dark:border-purple-800"></div>
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Navigating</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Going to {currentStepData.navigateTo?.split('/').pop() || 'page'}...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Tooltip */}
      {currentStepData && (elementFound || showFallback) && !isNavigating && (
        <div
          className={cn(
            "fixed z-[999999] w-80 max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 pointer-events-auto",
            className
          )}
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -50%)',
            maxWidth: '320px', // Slightly smaller for better fit
            minWidth: '280px',  // Ensure minimum width for readability
            maxHeight: '400px', // Prevent very tall tooltips
            overflowY: 'auto',  // Allow scrolling if content is too tall
            zIndex: '999999 !important',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="space-y-4">
            {/* Header */}
            <div className="pr-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {currentStepData.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentStepData.description}
              </p>
            </div>

            {/* Custom content or fallback */}
            {showFallback && currentStepData.fallbackContent ? (
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {currentStepData.fallbackContent}
              </div>
            ) : currentStepData.content ? (
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {currentStepData.content}
              </div>
            ) : null}

            {/* Debug info */}
            {debugMessage && (
              <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                {debugMessage}
              </div>
            )}

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div 
                className="bg-purple-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
          </div>

          {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-500">
                  {currentStep + 1} / {steps.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextStep}
                  disabled={currentStep === steps.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
              <Button
                  variant="outline"
                size="sm"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                  variant="outline"
                size="sm"
                onClick={restart}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render in portal if available, otherwise render normally
  return portalContainer ? createPortal(tooltipContent, portalContainer) : tooltipContent;
} 