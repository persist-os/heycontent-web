"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface CTAButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  size?: "default" | "lg" | "xl";
  variant?: "primary" | "secondary";
  className?: string;
  showArrow?: boolean;
}

const sizeClasses = {
  default: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
  xl: "px-10 py-5 text-xl",
};

export function CTAButton({ 
  children, 
  onClick, 
  href,
  size = "lg", 
  variant = "primary",
  className = "",
  showArrow = true
}: CTAButtonProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const handleClick = () => {
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else if (onClick) {
      onClick();
    }
  };

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme-aware colors
  const isDark = mounted && theme === 'dark';
  const primaryBg = isDark ? 'bg-accent' : 'bg-purple-600';
  const primaryHover = isDark ? 'hover:bg-accent/90' : 'hover:bg-purple-700';
  const primaryText = isDark ? 'text-accent-foreground' : 'text-white';
  const secondaryText = isDark ? 'text-accent' : 'text-purple-600';
  const secondaryBorder = isDark ? 'border-accent' : 'border-purple-600';
  const secondaryHover = isDark ? 'hover:bg-accent/10' : 'hover:bg-purple-600/10';
  const overlayBg = isDark ? 'bg-accent/20' : 'bg-purple-600/20';

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Button
        onClick={handleClick}
        className={cn(
          "font-bold shadow-xl transition-all duration-300 hover:shadow-2xl relative overflow-hidden group",
          sizeClasses[size],
          variant === "primary" && `${primaryBg} ${primaryText} ${primaryHover}`,
          variant === "secondary" && `bg-transparent ${secondaryText} border-2 ${secondaryBorder} ${secondaryHover}`,
          className
        )}
      >
        <motion.div
          className={`absolute inset-0 ${overlayBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          initial={false}
        />
        <span className="relative z-10 flex items-center gap-2">
          {children}
          {showArrow && (
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <ArrowRight className="h-5 w-5" />
            </motion.div>
          )}
        </span>
      </Button>
    </motion.div>
  );
}
