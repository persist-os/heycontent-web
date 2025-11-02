'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Activity, MessageSquare } from 'lucide-react';

interface WidgetStatus {
  widget_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface AssignmentStatus {
  assignment_id: string;
  overall_status: string;
  widgets: WidgetStatus[];
  artifacts: any[];
  needs_user_input?: {
    count: number;
    questions: any[];
  };
}

interface AssignmentStatusViewProps {
  assignmentStatus: AssignmentStatus | null;
  onAnswerQuestion: (questionId: string, answer: string) => void;
}

export function AssignmentStatusView({ assignmentStatus, onAnswerQuestion }: AssignmentStatusViewProps) {
  if (!assignmentStatus) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No status data. Run the status check test first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Assignment Status</CardTitle>
          <CardDescription>
            Real-time status from Redis + Convex
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="text-lg px-4 py-2">
                {assignmentStatus.overall_status}
              </Badge>
              {assignmentStatus.needs_user_input && (
                <Badge variant="outline" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {assignmentStatus.needs_user_input.count} questions pending
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Widget Statuses:</h4>
              {assignmentStatus.widgets.map((widget) => (
                <div key={widget.widget_id} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-mono text-sm">{widget.title}</span>
                  <Badge variant={
                    widget.status === 'completed' ? 'default' :
                    widget.status === 'in_progress' ? 'secondary' :
                    'outline'
                  }>
                    {widget.status}
                  </Badge>
                </div>
              ))}
            </div>

            {assignmentStatus.needs_user_input?.questions && (
              <div className="space-y-2">
                <h4 className="font-medium">Pending Questions:</h4>
                {assignmentStatus.needs_user_input.questions.map((q: any) => (
                  <Card key={q._id} className="p-3">
                    <p className="font-medium">{q.question}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      From widget: {q.widgetId}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Input placeholder="Your answer..." className="flex-1" id={`answer-${q._id}`} />
                      <Button 
                        size="sm" 
                        onClick={() => {
                          const input = document.getElementById(`answer-${q._id}`) as HTMLInputElement;
                          if (input?.value) {
                            onAnswerQuestion(q._id, input.value);
                          }
                        }}
                      >
                        Submit
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

