import React, { useEffect, useRef, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import './auto-scaling-text.css';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageContext } from '@/app/context/language-context';

interface AutoScalingTextProps {
  text: string;
  className?: string;
  maxFontSize?: number;
  minFontSize?: number;
  containerClassName?: string;
  responsive?: boolean;
  context?: string;
  enableTranslation?: boolean;
}

/**
 * AutoScalingText - A reusable component that automatically scales text to fit within its container
 * 
 * Features:
 * - Automatically adjusts font size to fit content within container
 * - Responsive to container size changes
 * - Configurable min/max font sizes
 * - Uses binary search for optimal performance
 * - Maintains aspect ratio and readability
 */
export const AutoScalingText: React.FC<AutoScalingTextProps> = ({
  text,
  className = '',
  maxFontSize,
  minFontSize,
  containerClassName = '',
  responsive = true,
  context,
  enableTranslation = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  
  // Translation logic
  const { language } = useLanguageContext();
  const { text: translatedText, isTranslating } = useTranslation(text, {
    sourceLang: 'en',
    targetLang: language,
    context,
    enabled: enableTranslation && language !== 'en'
  });
  
  // Use translated text if translation is enabled, otherwise use original
  const displayText = enableTranslation ? translatedText : text;
  
  // Calculate responsive font sizes based on screen and container dimensions
  const getResponsiveFontSizes = useCallback(() => {
    if (!containerRef.current) return { max: 14, min: 8 };
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const screenWidth = window.innerWidth;
    
    // Base font sizes on container size and screen breakpoints
    let baseMax: number;
    let baseMin: number;
    
    if (screenWidth < 640) { // Mobile
      baseMax = Math.min(containerWidth * 0.08, containerHeight * 0.25, 16);
      baseMin = Math.max(baseMax * 0.7, 10);
    } else if (screenWidth < 1024) { // Tablet
      baseMax = Math.min(containerWidth * 0.07, containerHeight * 0.22, 18);
      baseMin = Math.max(baseMax * 0.75, 12);
    } else { // Desktop
      baseMax = Math.min(containerWidth * 0.06, containerHeight * 0.22, 20);
      baseMin = Math.max(baseMax * 0.8, 14);
    }
    
    return {
      max: Math.floor(baseMax),
      min: Math.floor(baseMin)
    };
  }, []);

  const [fontSize, setFontSize] = useState(() => {
    const sizes = responsive ? getResponsiveFontSizes() : { max: maxFontSize || 14, min: minFontSize || 8 };
    return sizes.max;
  });

  const adjustFontSize = useCallback(() => {
    if (!containerRef.current || !textRef.current) return;

    const container = containerRef.current;
    const textElement = textRef.current;
    
    const containerHeight = container.clientHeight;
    const containerWidth = container.clientWidth;
    
    // Early return if container has no dimensions
    if (containerHeight <= 0 || containerWidth <= 0) return;
    
    // Get dynamic font size limits
    const fontSizes = responsive ? getResponsiveFontSizes() : { 
      max: maxFontSize || 14, 
      min: minFontSize || 8 
    };
    
    // Simple approach: start from max and step down until it fits
    let bestFit = fontSizes.min;
    
    // Test each font size from max to min
    for (let size = fontSizes.max; size >= fontSizes.min; size -= 1) {
      container.style.setProperty('--auto-scaling-font-size', `${size}px`);
      
      // Force multiple reflows to ensure accurate measurements
      void textElement.offsetHeight;
      void textElement.scrollHeight;
      void textElement.scrollWidth;
      
      // Get actual rendered dimensions
      const textHeight = textElement.scrollHeight;
      const textWidth = textElement.scrollWidth;
      
      // Reduced margins to allow more text space and prevent cutoff
      const heightMargin = 8;
      const widthMargin = 6;
      
      const fitsHeight = textHeight <= (containerHeight - heightMargin);
      const fitsWidth = textWidth <= (containerWidth - widthMargin);
      
      // Debug logging in development
      if (process.env.NODE_ENV === 'development' && size === fontSizes.max) {
        // AutoScaling Debug info available in dev mode
      }
      
      if (fitsHeight && fitsWidth) {
        bestFit = size;
        break;
      }
    }
    
    setFontSize(bestFit);
    container.style.setProperty('--auto-scaling-font-size', `${bestFit}px`);
  }, [maxFontSize, minFontSize, responsive, getResponsiveFontSizes]);

  // Initial sizing and resize observer setup
  useEffect(() => {
    // Delay initial adjustment to ensure DOM is ready
    const timeoutId = setTimeout(adjustFontSize, 10);
    
    // Debounce resize adjustments for better performance
    let resizeTimeoutId: NodeJS.Timeout;
    const debouncedAdjust = () => {
      clearTimeout(resizeTimeoutId);
      resizeTimeoutId = setTimeout(adjustFontSize, 50);
    };
    
    const resizeObserver = new ResizeObserver(debouncedAdjust);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimeoutId);
      resizeObserver.disconnect();
    };
  }, [displayText, adjustFontSize]);

  return (
    <div 
      ref={containerRef} 
      className={cn("auto-scaling-text-container", containerClassName)}
    >
      <p
        ref={textRef}
        className={cn(
          "auto-scaling-text auto-scaling-text--dynamic",
          "text-muted-foreground/80 hover:text-muted-foreground transition-colors duration-300",
          className
        )}
      >
        {displayText}
      </p>
    </div>
  );
};

export default AutoScalingText;
