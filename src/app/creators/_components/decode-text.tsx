"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface DecodeTextProps {
  children: string;
  className?: string;
  trigger?: boolean;
  decodeSpeed?: number;
  characters?: string;
}

const defaultCharacters = "!<>-_\\/[]{}—=+*^?#________";

export function DecodeText({ 
  children, 
  className = "", 
  trigger = true, 
  decodeSpeed = 50,
  characters = defaultCharacters 
}: DecodeTextProps) {
  const [displayText, setDisplayText] = useState(children);
  const [isDecoding, setIsDecoding] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    let interval: NodeJS.Timeout;
    let iteration = 0;
    
    setIsDecoding(true);
    
    interval = setInterval(() => {
      setDisplayText(() => {
        return children
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return children[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join("");
      });

      if (iteration >= children.length) {
        setIsDecoding(false);
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, decodeSpeed);

    return () => clearInterval(interval);
  }, [trigger, children, decodeSpeed, characters]);

  return (
    <motion.span 
      className={`font-mono ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {displayText}
      {isDecoding && (
        <motion.span
          className="inline-block w-0.5 h-[1em] bg-primary ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        />
      )}
    </motion.span>
  );
}
