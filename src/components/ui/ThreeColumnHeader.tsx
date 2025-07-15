import React from 'react';

interface ThreeColumnHeaderProps {
  left?: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  height?: string; // e.g., "h-14"
}

export const ThreeColumnHeader: React.FC<ThreeColumnHeaderProps> = ({
  left,
  center,
  right,
  className = '',
  height = 'h-16',
}) => (
  <div className={`grid grid-cols-3 items-center ${height} ${className}`} style={{ gridTemplateColumns: '1fr auto 1fr' }}>
    {/* Left */}
    <div className="flex justify-start">
      {left || <div />}
    </div>
    {/* Center */}
    <div className="text-center">
      {center}
    </div>
    {/* Right */}
    <div className="flex justify-end">
      {right || <div />}
    </div>
  </div>
);

export default ThreeColumnHeader; 