'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Diamond, 
  Square, 
  TrendingUp,
  Activity,
  RefreshCw,
  AlertCircle,
  Calendar,
  BarChart3,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrystalStatusProps {
  userId: string;
}

const CONFIDENCE_COLORS = {
  high: 'bg-green-500',
  medium: 'bg-yellow-500', 
  low: 'bg-red-500'
};

const CONFIDENCE_LABELS = {
  high: 'High Confidence',
  medium: 'Medium Confidence',
  low: 'Low Confidence'
};

export function CrystalStatus({ userId }: CrystalStatusProps) {
  const crystalStats = useQuery(api.crystalQueries.getCrystalStats, { userId });

  if (crystalStats === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Diamond className="w-5 h-5" />
            Knowledge Crystals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading crystal data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!crystalStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Knowledge Crystals Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Unable to load crystal data. Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { crystalsCount, shardsCount, byDimension, byConfidence, recentActivity } = crystalStats;
  const totalKnowledge = crystalsCount + shardsCount;
  const hasRecentActivity = recentActivity.crystalsThisWeek > 0 || recentActivity.shardsThisWeek > 0;

  return (
    <div className="space-y-6">
      {/* Main Crystal Stats Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Diamond className="w-5 h-5" />
              Knowledge Crystals
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasRecentActivity ? (
                <Badge variant="default" className="bg-blue-500">
                  <Activity className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  Stable
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Your personal knowledge is automatically crystallized from conversations, notes, and insights. 
            Crystals represent deep understanding while shards capture specific insights and quotes.
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{crystalsCount}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Knowledge Crystals</div>
              </div>
              <Diamond className="w-8 h-8 text-blue-500" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">{shardsCount}</div>
                <div className="text-sm text-green-600 dark:text-green-400">Knowledge Shards</div>
              </div>
              <Square className="w-8 h-8 text-green-500" />
            </div>
          </div>

          {/* Recent Activity */}
          {hasRecentActivity && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 mt-0.5 text-yellow-600 dark:text-yellow-400" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <div className="font-medium mb-1">Recent Activity (This Week)</div>
                  <div className="space-y-1">
                    {recentActivity.crystalsThisWeek > 0 && (
                      <div>• {recentActivity.crystalsThisWeek} new crystals formed</div>
                    )}
                    {recentActivity.shardsThisWeek > 0 && (
                      <div>• {recentActivity.shardsThisWeek} new insights captured</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Knowledge Breakdown */}
      {(Object.keys(byDimension).length > 0 || Object.keys(byConfidence).length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Knowledge Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* By Dimension */}
            {Object.keys(byDimension).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">By Knowledge Area</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(byDimension)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5) // Show top 5 dimensions
                    .map(([dimension, count]) => {
                      const percentage = crystalsCount > 0 ? ((count as number) / crystalsCount) * 100 : 0;
                      return (
                        <div key={dimension} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize">{dimension}</span>
                            <Badge variant="outline">{count as number}</Badge>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* By Confidence */}
            {Object.keys(byConfidence).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">By Confidence Level</span>
                </div>
                <div className="space-y-2">
                  {(['high', 'medium', 'low'] as const).map(level => {
                    const count = byConfidence[level] || 0;
                    if (count === 0) return null;
                    
                    const percentage = crystalsCount > 0 ? (count / crystalsCount) * 100 : 0;
                    return (
                      <div key={level} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{CONFIDENCE_LABELS[level]}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                        <Progress 
                          value={percentage} 
                          className={cn("h-2", `[&>[role=progressbar]]:${CONFIDENCE_COLORS[level]}`)} 
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {totalKnowledge > 0 && (
              <div className="pt-2 text-xs text-muted-foreground">
                Your knowledge crystals help power AI insights and personalized recommendations across the platform.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
