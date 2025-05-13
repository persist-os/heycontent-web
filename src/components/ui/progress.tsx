import React from "react";

export function Progress({ value = 0, max = 100, className = "" }) {
  return (
    <div className={`w-full h-2 bg-gray-200 rounded ${className}`} style={{ overflow: 'hidden' }}>
      <div
        className="h-2 bg-green-500 rounded transition-all duration-300"
        style={{ width: `${Math.min(value, max)}%` }}
      />
    </div>
  );
} 