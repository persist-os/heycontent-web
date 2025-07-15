'use client'

import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Mail, 
  Users, 
  Clock, 
  DollarSign,
  MessageSquare,
  Coins
} from 'lucide-react';

export type MetricFilter = 'all' | 'active' | 'pending' | 'high-value';

interface PartnershipMetricsProps {
  totalEmails: number;
  activePartnerships: number;
  pendingResponses: number;
  pipelineValue: number;
  activeFilter: MetricFilter;
  onFilterChange: (filter: MetricFilter) => void;
}

export default function PartnershipMetrics({ 
  totalEmails, 
  activePartnerships, 
  pendingResponses, 
  pipelineValue,
  activeFilter,
  onFilterChange
}: PartnershipMetricsProps) {
  const formatValue = (value: number) => {
    if (value === 0) return '$0';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
  };

  const metrics = [
    {
      label: 'Total Emails',
      value: totalEmails,
      icon: Mail,
      tooltip: 'Total partnership opportunities found',
      filter: 'all' as MetricFilter
    },
    {
      label: 'Active Discussions',
      value: activePartnerships,
      icon: MessageSquare,
      tooltip: 'Ongoing conversations and deals',
      filter: 'active' as MetricFilter
    },
    {
      label: 'Needs Response',
      value: pendingResponses,
      icon: Clock,
      tooltip: 'Opportunities waiting for your reply',
      filter: 'pending' as MetricFilter
    }
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between w-full">
        {/* Main metrics on the left */}
        <div className="flex items-center gap-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const isActive = activeFilter === metric.filter;
            
            return (
              <Tooltip key={metric.label}>
                <TooltipTrigger asChild>
                  <Card 
                    className={`p-3 cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/30 shadow-lg' 
                        : 'bg-card border-border hover:bg-muted'
                    }`}
                    onClick={() => onFilterChange(metric.filter)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs font-medium text-muted-foreground">
                            {metric.label}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-foreground">
                          {metric.value}
                        </p>
                      </div>
                    </div>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">{metric.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Deal value metric at the very right */}
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card 
                className={`p-3 cursor-pointer transition-all duration-200 ${
                  activeFilter === 'high-value' 
                    ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/30 shadow-lg' 
                    : 'bg-card border-border hover:bg-muted'
                }`}
                onClick={() => onFilterChange('high-value')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Coins className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                      <p className="text-xs font-medium text-muted-foreground">
                        Total Deal Value
                      </p>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {formatValue(pipelineValue)}
                    </p>
                  </div>
                </div>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">Total value of identified partnerships</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
} 