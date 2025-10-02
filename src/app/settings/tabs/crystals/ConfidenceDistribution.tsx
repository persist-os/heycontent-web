import React from 'react';
import { CrystalStats } from './types';

interface ConfidenceDistributionProps {
  crystalStats?: CrystalStats;
}

export const ConfidenceDistribution: React.FC<ConfidenceDistributionProps> = ({ crystalStats }) => {
  if (!crystalStats || !Object.keys(crystalStats.byConfidence).length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="font-medium text-foreground">Confidence Levels</h4>
        <p className="text-sm text-muted-foreground">How certain we are about these patterns</p>
      </div>
      
      <div className="space-y-3">
        {Object.entries(crystalStats.byConfidence).map(([level, count]) => (
          <div key={level} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                level === 'high' ? 'bg-blue-400' : 
                level === 'medium' ? 'bg-amber-400' : 'bg-gray-400'
              }`} />
              <span className="text-sm font-medium text-foreground capitalize">{level}</span>
            </div>
            <span className="text-sm text-muted-foreground">{count as number}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
