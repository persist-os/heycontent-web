import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import React from 'react';

interface RecentUsageEventsCardProps {
  usageEvents: any[];
}

export const RecentUsageEventsCard: React.FC<RecentUsageEventsCardProps> = ({ usageEvents }) => (
  <Card>
    <CardHeader>
      <CardTitle>Recent usage</CardTitle>
    </CardHeader>
    <CardContent>
      <details>
        <summary className="cursor-pointer select-none text-sm font-medium flex items-center justify-between">
          Routes
          <span className="text-xs text-muted-foreground">{usageEvents.length}</span>
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
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
                  <tr key={event._id} className="border-b last:border-0">
                    <td className="py-2 px-2">{
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
                    <td className="py-2 px-2">{displayPath || '—'}</td>
                    <td className="py-2 px-2">{event.status}</td>
                    <td className="py-2 px-2">{event.qty}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </CardContent>
  </Card>
);
