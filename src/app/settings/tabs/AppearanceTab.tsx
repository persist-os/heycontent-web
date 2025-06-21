'use client';

import { ThemeToggle } from "@/components/theme-toggle";

const AppearanceTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of the app.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <label className="text-base font-medium">Theme</label>
            <p className="text-sm text-muted-foreground">
              Select the theme for the dashboard.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default AppearanceTab; 