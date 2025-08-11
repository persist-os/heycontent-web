"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface RevealTextProps {
  children: string;
  className?: string;
  delay?: number;
  speed?: number;
}

export function RevealText({ children, className = "", delay = 0, speed = 0.05 }: RevealTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < children.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + children[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed * 1000);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, children, speed]);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setCurrentIndex(0);
      setDisplayedText("");
    }, delay * 1000);

    return () => clearTimeout(startTimeout);
  }, [delay]);

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      {displayedText}
      {currentIndex < children.length && (
        <motion.span
          className="inline-block w-0.5 h-[1em] bg-current ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        />
      )}
    </motion.span>
  );
}
