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
  MessageSquare
} from 'lucide-react';

interface PartnershipMetricsProps {
  totalEmails: number;
  activePartnerships: number;
  pendingResponses: number;
  pipelineValue: number;
  activeFilter?: 'all' | 'active' | 'needs_response' | 'deal_value';
  onFilterChange?: (filter: 'all' | 'active' | 'needs_response' | 'deal_value') => void;
}

export default function PartnershipMetrics({ 
  totalEmails, 
  activePartnerships, 
  pendingResponses, 
  pipelineValue,
  activeFilter = 'all',
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
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      tooltip: 'Total number of emails loaded in the partnerships view',
      filterKey: 'all' as const
    },
    {
      label: 'Active Discussions',
      value: activePartnerships,
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      tooltip: 'Emails with ongoing conversations or confirmed deals (4+ messages or high value)',
      filterKey: 'active' as const
    },
    {
      label: 'Needs Response',
      value: pendingResponses,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      tooltip: 'Emails where the user is not the last sender and needs to respond',
      filterKey: 'needs_response' as const
    },
    {
      label: 'Deal Value',
      value: formatValue(pipelineValue),
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      tooltip: 'Total confirmed deal values extracted from email content',
      filterKey: 'deal_value' as const
    }
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isActive = activeFilter === metric.filterKey;
          
          return (
            <Tooltip key={metric.label}>
              <TooltipTrigger asChild>
                <Card 
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    isActive 
                      ? 'ring-2 ring-primary bg-primary/5 border-primary' 
                      : 'hover:bg-primary/5'
                  }`}
                  onClick={() => onFilterChange?.(metric.filterKey)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                      <Icon className={`w-5 h-5 ${metric.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="text-xl font-semibold text-foreground">
                        {typeof metric.value === 'string' ? metric.value : metric.value}
                      </p>
                    </div>
                  </div>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{metric.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
} 