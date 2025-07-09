'use client'

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Plus,
  Star,
  ArrowRight
} from 'lucide-react';
import { AIOpportunity } from '../types';

interface PartnershipOpportunitiesProps {
  opportunities: AIOpportunity[];
  onCreatePartnership: (opportunity: AIOpportunity) => void;
}

export default function PartnershipOpportunities({ 
  opportunities, 
  onCreatePartnership 
}: PartnershipOpportunitiesProps) {
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
  };

  if (opportunities.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">AI Opportunities</h2>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            <Sparkles className="w-3 h-3 mr-1" />
            0 detected
          </Badge>
        </div>
        
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-muted">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-2">No Opportunities Found</h3>
              <p className="text-sm text-muted-foreground">
                Our AI will analyze your emails to find potential partnership opportunities
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">AI Opportunities</h2>
        <Badge variant="outline" className="bg-primary/10 text-primary">
          <Sparkles className="w-3 h-3 mr-1" />
          {opportunities.length} detected
        </Badge>
      </div>

      <div className="space-y-3">
        {opportunities.map((opportunity) => (
          <Card key={opportunity.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground line-clamp-1">
                    {opportunity.brandName}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {opportunity.subject}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  <Badge variant="outline" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    {Math.round(opportunity.confidence * 100)}%
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-foreground line-clamp-2">
                {opportunity.snippet}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {formatValue(opportunity.estimatedValue)}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Thread
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  onClick={() => onCreatePartnership(opportunity)}
                  className="h-7 px-3 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Create
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 