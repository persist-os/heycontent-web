'use client'

import React, { createContext, useContext, useState } from 'react';

interface InlineReplyContextType {
  isInlineReplyActive: boolean;
  setIsInlineReplyActive: (active: boolean) => void;
}

const InlineReplyContext = createContext<InlineReplyContextType | undefined>(undefined);

export function InlineReplyProvider({ children }: { children: React.ReactNode }) {
  const [isInlineReplyActive, setIsInlineReplyActive] = useState(false);

  return (
    <InlineReplyContext.Provider 
      value={{ 
        isInlineReplyActive, 
        setIsInlineReplyActive 
      }}
    >
      {children}
    </InlineReplyContext.Provider>
  );
}

export function useInlineReply() {
  const context = useContext(InlineReplyContext);
  if (context === undefined) {
    throw new Error('useInlineReply must be used within an InlineReplyProvider');
  }
  return context;
} 