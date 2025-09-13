import React from 'react';

interface InsightIconProps {
  icon: React.ComponentType<{ className?: string }>;
  type: string;
}

export const InsightIcon = ({ icon: Icon, type }: InsightIconProps) => {
  // Map type to color like in the nav
  let colorClass = "text-blue-500"; // Default blue for notes type
  
  if (type === "content") {
    colorClass = "text-purple-500"; // AI Insights - purple
  } else if (type === "platform") {
    colorClass = "text-green-500"; // Audience DNA - green
  } else if (type === "strategy") {
    colorClass = "text-orange-500"; // Partnerships - orange
  } else if (type === "notes") {
    colorClass = "text-blue-500"; // File System - blue
  }
  
  return <Icon className={`w-5 h-5 ${colorClass}`} />;
};
