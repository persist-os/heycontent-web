'use client';

import React from 'react';
import { Mail, MessageSquare } from 'lucide-react';

export function PartnershipEmptyState() {
  return (
    <div className="flex items-center justify-center h-full min-h-[600px] text-center px-8">
      <div className="space-y-6 max-w-md">
        <div className="mx-auto w-48 h-48 rounded-2xl bg-muted/50 flex items-center justify-center relative">
          {/* Composite icon: Mail with chat bubble overlay */}
          <div className="relative">
            <Mail className="w-40 h-40 text-muted-foreground" />
            <MessageSquare className="w-20 h-20 text-muted-foreground absolute -bottom-2 -left-2 fill-background" />
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-foreground">Ready to dive into your next collaboration?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pick a partnership from the left to explore the conversation, draft replies, and turn opportunities into collaborations
          </p>
        </div>
      </div>
    </div>
  );
}
