'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TiptapEditorContextType {
  isTiptapEditorActive: boolean;
  setTiptapEditorActive: (active: boolean) => void;
}

const TiptapEditorContext = createContext<TiptapEditorContextType | undefined>(undefined);

export function TiptapEditorProvider({ children }: { children: ReactNode }) {
  const [isTiptapEditorActive, setIsTiptapEditorActive] = useState(false);

  const setTiptapEditorActive = (active: boolean) => {
    setIsTiptapEditorActive(active);
  };

  return (
    <TiptapEditorContext.Provider value={{ isTiptapEditorActive, setTiptapEditorActive }}>
      {children}
    </TiptapEditorContext.Provider>
  );
}

export function useTiptapEditor() {
  const context = useContext(TiptapEditorContext);
  if (context === undefined) {
    throw new Error('useTiptapEditor must be used within a TiptapEditorProvider');
  }
  return context;
}
