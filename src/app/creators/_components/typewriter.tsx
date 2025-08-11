"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  completionDelay?: number;
  className?: string;
  showCursor?: boolean;
  onComplete?: () => void;
}

export function Typewriter({ 
  text, 
  speed = 100, 
  delay = 0, 
  completionDelay = 1500,
  className = "", 
  showCursor = true,
  onComplete 
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (delay > 0) {
      const delayTimer = setTimeout(() => {
        setHasStarted(true);
        setIsTyping(true);
      }, delay);
      return () => clearTimeout(delayTimer);
    } else {
      setHasStarted(true);
      setIsTyping(true);
    }
  }, [delay]);

  useEffect(() => {
    if (!isTyping || !hasStarted) return;

    if (displayedText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
      // Add a delay after typing is complete to let people read the text
      const completionTimer = setTimeout(() => {
        onComplete?.();
      }, completionDelay);
      return () => clearTimeout(completionTimer);
    }
  }, [displayedText, text, speed, isTyping, hasStarted, onComplete, completionDelay]);

  // Theme-aware cursor color
  const isDark = mounted && theme === 'dark';
  const cursorColor = isDark ? 'bg-accent' : 'bg-purple-600';

  return (
    <motion.span 
      className={cn("inline-block", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: hasStarted ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      {displayedText}
      {showCursor && (
        <motion.span
          className={`inline-block w-0.5 h-[1em] ${cursorColor} ml-1 align-middle`}
          animate={{ 
            opacity: isTyping ? [1, 0, 1] : [1, 0] 
          }}
          transition={{ 
            duration: isTyping ? 1 : 0.5, 
            repeat: isTyping ? Infinity : 3,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.span>
  );
}
