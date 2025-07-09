'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  DollarSign, 
  MessageSquare, 
  Mail,
  ChevronRight,
  Star,
  Calendar
} from 'lucide-react';
import { Partnership } from '../types';

interface ActivePartnershipsProps {
  partnerships: Partnership[];
  selectedPartnership: Partnership | null;
  onSelectPartnership: (partnership: Partnership) => void;
  onUpdateStatus: (partnershipId: string, status: Partnership['status']) => void;
  loading?: boolean;
  hideHeader?: boolean;
}

export default function ActivePartnerships({
  partnerships,
  selectedPartnership,
  onSelectPartnership,
  onUpdateStatus,
  loading = false,
  hideHeader = false
}: ActivePartnershipsProps) {
  const getStatusColor = (status: Partnership['status']) => {
    switch (status) {
      case 'opportunity':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'inquiry':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'negotiating':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
      case 'active':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'completed':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: Partnership['status']) => {
    switch (status) {
      case 'opportunity':
        return <Star className="w-3 h-3" />;
      case 'inquiry':
        return <MessageSquare className="w-3 h-3" />;
      case 'negotiating':
        return <Clock className="w-3 h-3" />;
      case 'active':
        return <DollarSign className="w-3 h-3" />;
      case 'completed':
        return <Calendar className="w-3 h-3" />;
      default:
        return <Mail className="w-3 h-3" />;
    }
  };

  const formatEstimatedValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${value}`;
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    // Use a stable reference time to avoid hydration mismatches
    const now = typeof window !== 'undefined' ? Date.now() : timestamp;
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const getNextStatus = (currentStatus: Partnership['status']) => {
    const statusFlow = ['opportunity', 'inquiry', 'negotiating', 'active', 'completed'] as const;
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : currentStatus;
  };

  const canAdvanceStatus = (status: Partnership['status']) => {
    return status !== 'completed' && status !== 'active';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {!hideHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Active Partnerships</h2>
            <Badge variant="outline">•••</Badge>
          </div>
        )}
        
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="p-4 animate-pulse">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                  <div className="w-4 h-4 bg-muted rounded"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-muted rounded w-20"></div>
                  <div className="h-4 bg-muted rounded w-12"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (partnerships.length === 0) {
    return (
      <div className="space-y-4">
        {!hideHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Active Partnerships</h2>
            <Badge variant="outline">{partnerships.length}</Badge>
          </div>
        )}
        
        <Card className="p-8 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Active Partnerships</h3>
          <p className="text-muted-foreground mb-4">
            Partnerships will appear here as you convert opportunities and begin negotiations.
          </p>
          <p className="text-sm text-muted-foreground">
            Create partnerships from the opportunities panel or Gmail threads.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Active Partnerships</h2>
          <Badge variant="outline">{partnerships.length}</Badge>
        </div>
      )}
      
      <div className="space-y-3">
        {partnerships.map((partnership) => (
          <Card 
            key={partnership.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md border-l-4 ${
              selectedPartnership?.id === partnership.id 
                ? 'ring-2 ring-primary bg-primary/5 border-l-primary' 
                : 'border-l-border hover:border-l-primary/50'
            }`}
            onClick={() => onSelectPartnership(partnership)}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {partnership.brandName}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {partnership.subject}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
              </div>

              {/* Status and Value */}
              <div className="flex items-center justify-between">
                <Badge 
                  className={`text-xs flex items-center gap-1 ${getStatusColor(partnership.status)}`}
                >
                  {getStatusIcon(partnership.status)}
                  {partnership.status}
                </Badge>
                
                {partnership.estimatedValue > 0 && (
                  <span className="text-xs font-medium text-foreground">
                    {formatEstimatedValue(partnership.estimatedValue)}
                  </span>
                )}
              </div>

              {/* Message Count and Activity */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  {partnership.messageCount > 1 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {partnership.messageCount} messages
                    </span>
                  )}
                </div>
                <span>{formatTimeAgo(partnership.lastActivity)}</span>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPartnership(partnership);
                  }}
                >
                  <Mail className="w-3 h-3 mr-1" />
                  View Thread
                </Button>
                
                {canAdvanceStatus(partnership.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(partnership.id, getNextStatus(partnership.status));
                    }}
                  >
                    Advance to {getNextStatus(partnership.status)}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {partnerships.length > 10 && (
        <div className="text-center pt-4">
          <Button variant="outline" size="sm">
            Load More Partnerships
          </Button>
        </div>
      )}
    </div>
  );
} 