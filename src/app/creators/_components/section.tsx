"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  background?: "default" | "muted" | "transparent";
  spacing?: "sm" | "md" | "lg" | "xl";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const backgroundClasses = {
  default: "bg-background",
  muted: "bg-muted/30",
  transparent: "bg-transparent",
};

const spacingClasses = {
  sm: "py-12",
  md: "py-16", 
  lg: "py-20",
  xl: "py-24",
};

const maxWidthClasses = {
  sm: "max-w-2xl",
  md: "max-w-4xl", 
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-none",
};

export function Section({ 
  children, 
  className = "", 
  background = "transparent",
  spacing = "lg",
  maxWidth = "lg"
}: SectionProps) {
  return (
    <motion.section 
      className={cn(
        "relative w-full",
        backgroundClasses[background],
        spacingClasses[spacing],
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className={cn(
        "container mx-auto px-4 sm:px-6 lg:px-8",
        maxWidthClasses[maxWidth]
      )}>
        {children}
      </div>
    </motion.section>
  );
}
