import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import React from 'react';

interface ActiveSessionsCardProps {
  sessions: any[];
  revokeSession: (sessionId: string) => void;
}

export const ActiveSessionsCard: React.FC<ActiveSessionsCardProps> = ({ sessions, revokeSession }) => (
  <Card>
    <CardHeader>
      <CardTitle>Active Sessions</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {sessions.length === 0 && <div className="text-sm text-gray-500">No active sessions</div>}
      {sessions.map(session => (
        <div key={session._id} className="flex justify-between items-center p-2 bg-gray-50 rounded mb-1">
          <div>
            <div className="font-medium text-sm">{session.type === "desktop" ? "Desktop App Session" : "Web Session"}</div>
            <div className="text-xs text-gray-500">Created {new Date(session.createdAt).toLocaleDateString()}</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => revokeSession(session._id)} disabled={session.revoked}>
            {session.revoked ? "Revoked" : "Revoke"}
          </Button>
        </div>
      ))}
      <div className="text-xs text-gray-400 mt-2">Note: Session revocation may take up to 10 minutes to take effect.</div>
    </CardContent>
  </Card>
);
