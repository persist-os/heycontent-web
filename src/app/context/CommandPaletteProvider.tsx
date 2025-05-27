'use client';

import { ReactNode } from 'react';
import { CommandPalette } from '../../components/ui/CommandPalette';

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CommandPalette />
    </>
  );
} 