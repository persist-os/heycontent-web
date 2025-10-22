import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Check, Zap } from 'lucide-react';
import { T } from '@/components/translation';

export function ApiCallBreakdown() {
  const meteredCalls = [
    { action: 'Send a chat message', calls: '1 call' },
    { action: 'Create or edit a note', calls: '1 call' },
    { action: 'AI writing assistance', calls: '1-2 calls' },
    { action: 'Generate smart tags/metadata', calls: '2 calls' },
    { action: 'Refine text', calls: '1 call' },
    { action: 'Generate ambient insights', calls: '3-5 calls' },
    { action: 'Get note idea suggestions', calls: '1 call' },
  ];

  const freeCalls = [
    'Crystal intelligence formation',
    'Shard extraction & embedding',
    'Background memory consolidation',
    'Automatic pattern recognition',
    'Psychological profile building',
    'Context enrichment (passive)',
    'Thought connection mapping',
    'Reading notes/conversations',
    'Project organization',
    'Browsing your content',
    'Memory retrieval & search',
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Free Actions */}
      <Card className="border-green-200 dark:border-green-900">
        <CardHeader className="bg-green-50 dark:bg-green-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-lg text-green-700 dark:text-green-400">
              <T context="apiCallBreakdown.alwaysFree">Always Free</T>
            </CardTitle>
          </div>
          <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-2">
            <T context="apiCallBreakdown.neverCounts">Never counts toward your quota</T>
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-green-100 dark:divide-green-900/50">
            {freeCalls.map((item, index) => (
              <div key={index} className="px-6 py-4 hover:bg-green-50/50 dark:hover:bg-green-950/20 transition-colors">
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <span className="text-sm">
                    <T context={`apiCallBreakdown.free${index + 1}`}>{item}</T>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metered Actions */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              <Zap className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <CardTitle className="text-lg">
              <T context="apiCallBreakdown.meteredActions">Metered Actions</T>
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            <T context="apiCallBreakdown.countsToward">These count toward your API quota</T>
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {meteredCalls.map((item, index) => (
              <div key={index} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm">
                    <T context={`apiCallBreakdown.metered${index + 1}.action`}>{item.action}</T>
                  </span>
                  <span className="text-sm font-mono text-muted-foreground shrink-0">
                    <T context={`apiCallBreakdown.metered${index + 1}.calls`}>{item.calls}</T>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}