"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  gradient?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
}

const sizeClasses = {
  sm: "text-lg sm:text-xl",
  md: "text-xl sm:text-2xl",
  lg: "text-2xl sm:text-3xl lg:text-4xl",
  xl: "text-3xl sm:text-4xl lg:text-5xl",
  "2xl": "text-4xl sm:text-5xl lg:text-6xl",
  "3xl": "text-4xl sm:text-6xl lg:text-7xl xl:text-8xl",
};

const alignClasses = {
  left: "text-left",
  center: "text-center", 
  right: "text-right",
};

export function Heading({ 
  children, 
  level = 2, 
  size = "xl", 
  gradient = true,
  className = "",
  align = "center"
}: HeadingProps) {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Theme-aware gradient
  const isDark = mounted && theme === 'dark';
  const gradientClass = isDark 
    ? "bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent"
    : "bg-gradient-to-r from-foreground via-purple-600 to-foreground bg-clip-text text-transparent";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <Component 
        className={cn(
          "font-black tracking-tight leading-tight",
          sizeClasses[size],
          alignClasses[align],
          gradient && gradientClass,
          !gradient && "text-foreground",
          className
        )}
      >
        {children}
      </Component>
    </motion.div>
  );
}
