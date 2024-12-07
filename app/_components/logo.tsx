import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-10" }: LogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 400 100"
      className={className}
    >
      <g transform="translate(40, 20)">
        <path 
          d="M0,60 L40,0 L60,0 L20,60 Z" 
          className="fill-current"
        />
        <circle 
          cx="50" 
          cy="30" 
          r="8" 
          className="fill-current"
        />
      </g>
      <text 
        x="120" 
        y="60" 
        style={{ 
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: "42px",
          fontWeight: 700
        }}
        className="fill-current"
      >
        AVA IRIS
      </text>
    </svg>
  );
}