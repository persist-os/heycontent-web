'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FolderModalProps, AnalyticsItem } from './types';
import { BarChart3, TrendingUp, TrendingDown, Minus, Clock, Instagram, Youtube } from 'lucide-react';

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return TrendingUp;
    case 'down': return TrendingDown;
    case 'stable': return Minus;
    default: return Minus;
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'up': return 'text-emerald-600 dark:text-emerald-400';
    case 'down': return 'text-red-600 dark:text-red-400';
    case 'stable': return 'text-muted-foreground';
    default: return 'text-muted-foreground';
  }
};

const formatValue = (value: number | undefined, metric?: string) => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  if (metric && (metric.toLowerCase().includes('rate') || metric.toLowerCase().includes('percentage'))) {
    return `${value}%`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
};

const getPlatformIcon = (platform?: string) => {
  switch (platform?.toLowerCase()) {
    case 'instagram': return Instagram;
    case 'youtube': return Youtube;
    default: return BarChart3;
  }
};

export const AnalyticsFolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  folderData
}) => {
  // Use real analytics data from folderData.items or fallback to empty array
  const analyticsItems = (folderData.items || []) as AnalyticsItem[];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            Analytics Reports
            <span className="text-sm text-muted-foreground">({folderData.count} items)</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {analyticsItems.map((item) => {
              const TrendIcon = getTrendIcon(item.trend);
              const trendColor = getTrendColor(item.trend);
              const PlatformIcon = getPlatformIcon(item.platform);
              
              return (
                <div
                  key={item.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <PlatformIcon className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {item.date ? new Date(item.date).toLocaleDateString() : 'No date'}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.preview}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-foreground">
                        {formatValue(item.value, item.metric)}
                      </div>
                      <div className={`flex items-center gap-1 ${trendColor}`}>
                        <TrendIcon className="w-4 h-4" />
                        <span className="text-sm font-medium capitalize">{item.trend}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {item.metric}
                    </div>
                    <div className="text-muted-foreground">
                      {item.period}
                    </div>
                  </div>
                  
                  <div className="mt-3 bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Performance</span>
                      <div className="flex items-center gap-1">
                        {item.trend === 'up' && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">Improving</span>
                        )}
                        {item.trend === 'down' && (
                          <span className="text-xs text-red-600 dark:text-red-400">Declining</span>
                        )}
                        {item.trend === 'stable' && (
                          <span className="text-xs text-muted-foreground">Stable</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 