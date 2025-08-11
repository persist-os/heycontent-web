"use client";

import { motion } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface FeatureItem {
  icon: ReactNode;
  title: string;
  description: string;
}

interface FeatureListProps {
  items: FeatureItem[];
  className?: string;
}

export function FeatureList({ items, className = "" }: FeatureListProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Theme-aware accent colors
  const isDark = mounted && theme === 'dark';
  const accentBg = isDark ? 'bg-accent/10' : 'bg-purple-600/10';
  const accentText = isDark ? 'text-accent' : 'text-purple-600';
  const accentBorder = isDark ? 'hover:border-accent/30' : 'hover:border-purple-600/30';
  
  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => (
        <motion.div
          key={item.title}
          className={`flex items-start gap-4 p-4 rounded-lg bg-background/60 backdrop-blur-sm border border-border/30 ${accentBorder} transition-colors duration-300`}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ 
            delay: index * 0.1, 
            duration: 0.5,
            ease: "easeOut"
          }}
          whileHover={{ 
            scale: 1.02,
            transition: { duration: 0.2 }
          }}
        >
          <div className={`flex-shrink-0 p-2 rounded-full ${accentBg} ${accentText}`}>
            {item.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1 leading-tight">
              {item.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
