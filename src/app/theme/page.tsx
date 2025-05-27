import React from 'react';
import { ColorThemeDemo } from '../../components/ui/color-theme-demo';

export default function ThemePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <ColorThemeDemo />
      </div>
    </div>
  );
} 