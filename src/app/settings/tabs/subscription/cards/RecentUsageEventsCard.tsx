import { BaseCard } from '@/components/ui/base-card';
import React from 'react';

interface RecentUsageEventsCardProps {
  usageEvents: any[];
}

export const RecentUsageEventsCard: React.FC<RecentUsageEventsCardProps> = ({ usageEvents }) => (
  <BaseCard variant="recent-usage" title="Recent usage">
      <details className="w-full overflow-hidden">
        <summary className="cursor-pointer select-none text-sm font-medium flex items-center justify-between py-2">
          Routes
          <span className="text-xs text-muted-foreground">{usageEvents.length}</span>
        </summary>
        <div className="mt-3 overflow-x-auto overflow-y-auto max-h-[400px] border border-border/50 rounded-md">
          <table className="min-w-full text-xs">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 px-2">UTC Time</th>
                <th className="py-2 px-2">Path</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2">Qty</th>
              </tr>
            </thead>
            <tbody>
              {usageEvents.length === 0 && (
                <tr><td colSpan={4} className="text-center text-muted-foreground py-4">No recent usage</td></tr>
              )}
              {usageEvents.map((event: any) => {
                const rawPath = typeof event.path === 'string' ? event.path : '';
                const displayPath = rawPath.replace(/^\/?api\/v1\//, '');
                return (
                  <tr key={event._id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 px-2 whitespace-nowrap">{
                      (() => {
                        let ts = event.timestamp;
                        if (typeof ts === 'number' && ts < 1e12) ts = ts * 1000;
                        const date = new Date(ts);
                        const utcString = date.toISOString().replace('T', ' ').replace('Z', ' UTC');
                        return (
                          <div>{utcString}</div>
                        );
                      })()
                    }</td>
                    <td className="py-2 px-2 max-w-[200px] truncate" title={displayPath || '—'}>{displayPath || '—'}</td>
                    <td className="py-2 px-2 whitespace-nowrap">{event.status}</td>
                    <td className="py-2 px-2 whitespace-nowrap">{event.qty}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
  </BaseCard>
);
