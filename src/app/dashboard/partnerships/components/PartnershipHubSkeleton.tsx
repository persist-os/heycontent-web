'use client'

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Mail, 
  Search, 
  RefreshCw,
  TrendingUp,
  MessageCircle,
  DollarSign,
  Users,
  X
} from 'lucide-react';

interface PartnershipHubSkeletonProps {
  isLoading?: boolean;
  showPreview?: boolean;
  onConnectGmail?: () => void;
}

export function PartnershipHubSkeleton({ 
  isLoading = false, 
  showPreview = false, 
  onConnectGmail 
}: PartnershipHubSkeletonProps) {
  const [isOverlayDismissed, setIsOverlayDismissed] = React.useState(false);
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Header Skeleton */}
        <div className="border-b border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Search and Filter Skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Skeleton className="h-10 w-full pl-10" />
            </div>
          </div>

          {/* Metrics Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column Skeleton */}
          <div className="w-1/2 border-r border-border p-4">
            <div className="mb-4">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="w-1/2 p-4">
            <Skeleton className="h-6 w-40 mb-4" />
            <Card className="p-6">
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Preview mode when Gmail not connected
  if (showPreview) {
    const mockMetrics = [
      { icon: Mail, label: 'Total Emails', value: '247', color: 'text-blue-600' },
      { icon: Users, label: 'Active Partnerships', value: '12', color: 'text-green-600' },
      { icon: MessageCircle, label: 'Needs Response', value: '5', color: 'text-orange-600' },
      { icon: DollarSign, label: 'Pipeline Value', value: '$45.2K', color: 'text-purple-600' }
    ];

    const mockPartnerships = [
      { brand: 'TechCorp', status: 'Active', value: '$5,000', subject: 'Partnership Proposal for Q1 Campaign' },
      { brand: 'FashionBrand', status: 'Negotiating', value: '$3,200', subject: 'Influencer Collaboration Opportunity' },
      { brand: 'StartupX', status: 'Inquiry', value: '$1,500', subject: 'Content Creation Partnership' },
      { brand: 'BigCompany', status: 'Active', value: '$8,000', subject: 'Long-term Brand Ambassador Program' },
      { brand: 'LocalBusiness', status: 'Opportunity', value: '$500', subject: 'Social Media Collaboration' }
    ];

         return (
       <div className="h-screen flex flex-col bg-background relative">
         {/* Preview Content */}
         <div className="opacity-80 pointer-events-none">
          {/* Header */}
          <div className="border-b border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Partnership Hub</h1>
                <p className="text-muted-foreground">
                  View and manage all emails, track partnerships, and identify collaboration opportunities
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" disabled>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Gmail
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <div className="h-10 bg-muted rounded-md pl-10 flex items-center">
                  <span className="text-muted-foreground text-sm">Search emails, brands, or status...</span>
                </div>
              </div>
            </div>

            {/* Mock Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {mockMetrics.map((metric, i) => (
                <Card key={i} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-muted ${metric.color}`}>
                      <metric.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Mock Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column */}
            <div className="w-1/2 border-r border-border p-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">Active Partnerships</h2>
                  <Badge variant="outline">{mockPartnerships.length}</Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                {mockPartnerships.map((partnership, i) => (
                  <Card key={i} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                        {partnership.brand.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{partnership.brand}</p>
                          <Badge variant="outline" className="text-xs">
                            {partnership.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {partnership.subject}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">2 days ago</span>
                          <span className="text-sm font-semibold text-green-600">
                            {partnership.value}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="w-1/2 p-4">
              <h3 className="text-lg font-semibold mb-4">Partnership Details</h3>
              <Card className="p-6">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a partnership to view details, conversation history, and manage collaboration status.</p>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Floating Connect Card - Dismissable */}
        {!isOverlayDismissed && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
            <Card className="p-8 text-center max-w-md mx-auto shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
              {/* Dismiss Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOverlayDismissed(true)}
                className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-3">Connect Gmail to Get Started</h2>
              <p className="text-muted-foreground mb-6 text-sm">
                Connect your Gmail to automatically detect partnership opportunities, track brand collaborations, and manage your creator business relationships.
              </p>
              <Button 
                onClick={onConnectGmail}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 w-full mb-4"
              >
                <Mail className="w-4 h-4 mr-2" />
                Connect Gmail Account
              </Button>
              <p className="text-xs text-muted-foreground">
                👇 Preview of what you'll get
              </p>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return null;
} 