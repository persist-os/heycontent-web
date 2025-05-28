import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import React from 'react';

interface RecentUsageEventsCardProps {
  usageEvents: any[];
}

export const RecentUsageEventsCard: React.FC<RecentUsageEventsCardProps> = ({ usageEvents }) => (
  <Card>
    <CardHeader>
      <CardTitle>Recent Usage Events</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2 px-2">UTC Time</th>
              <th className="py-2 px-2">Type</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2">Qty</th>
            </tr>
          </thead>
          <tbody>
            {usageEvents.length === 0 && (
              <tr><td colSpan={4} className="text-center text-gray-400 py-4">No usage events</td></tr>
            )}
            {usageEvents.map((event: any) => (
              <tr key={event._id} className="border-b last:border-0">
                <td className="py-2 px-2">{
                  (() => {
                    let ts = event.timestamp;
                    if (typeof ts === 'number' && ts < 1e12) ts = ts * 1000;
                    const date = new Date(ts);
                    // Format in UTC
                    const utcString = date.toISOString().replace('T', ' ').replace('Z', ' UTC');
                    return (
                      <div>{utcString}</div>
                    );
                  })()
                }</td>
                <td className="py-2 px-2">{event.model}</td>
                <td className="py-2 px-2">{event.status}</td>
                <td className="py-2 px-2">{event.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);
