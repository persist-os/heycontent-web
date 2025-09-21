import React from 'react';
import { ShardData } from './types';

interface ShardCardProps {
  shard: ShardData;
}

export const ShardCard: React.FC<ShardCardProps> = ({ shard }) => {
  return (
    <div className="border border-border/50 rounded-xl p-4 space-y-3">
      {shard.exact_quote && (
        <blockquote className="text-sm text-foreground italic border-l-2 border-blue-400/60 pl-3 leading-relaxed">
          "{shard.exact_quote}"
        </blockquote>
      )}

      <div className="space-y-2">
        {shard.what_it_reveals && (
          <div className="space-y-1">
            <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">Reveals</h5>
            <p className="text-sm text-muted-foreground leading-relaxed">{shard.what_it_reveals}</p>
          </div>
        )}

        {shard.why_significant && (
          <div className="space-y-1">
            <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">Significance</h5>
            <p className="text-sm text-muted-foreground leading-relaxed">{shard.why_significant}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-muted/30 rounded">
            {shard.dimension}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${
            shard.confidence_level === 'high' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' :
            shard.confidence_level === 'medium' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' :
            'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}>
            {shard.confidence_level}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {shard.source_type}
        </span>
      </div>
    </div>
  );
};
