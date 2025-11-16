import React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export function Progress({ value = 0, max = 100, className = "", indicatorClassName }: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div 
      className={cn("w-full h-3 rounded-md overflow-hidden relative", className)} 
    >
      {/* Track */}
      <div className="w-full h-full bg-[hsl(var(--assignment-outline))] rounded-md" />
      
      {/* Active indicator with orange gradient */}
      <div
        className={cn(
          "absolute top-0 left-0 h-full bg-[hsl(var(--assignment-brand-orange))] rounded-md transition-all duration-300",
          indicatorClassName
        )}
        style={{ 
          width: `${percentage}%`
        }}
      />
    </div>
  );
} 