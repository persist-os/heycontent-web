import React from 'react';
import { AlertCircle } from 'lucide-react';

export function Instructions() {
  return (
    <>
      {/* How to Export */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          How to Export from ChatGPT
        </h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>Go to ChatGPT Settings → Data Controls</li>
          <li>Click "Export data"</li>
          <li>Wait for email with download link (can take a few hours)</li>
          <li>Download the zip file and upload it here</li>
        </ol>
        <p className="mt-2 text-sm text-muted-foreground">
          We'll extract your conversations and add them to your content library.
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
        <h4 className="font-semibold">What happens next?</h4>
        <ul className="space-y-1 text-muted-foreground">
          <li>• Your conversations are processed in the background (non-blocking)</li>
          <li>• Both user and assistant messages are included for full context</li>
          <li>• Content is added to the Crystal Dam in batches</li>
          <li>• Shard extraction and crystal formation happen automatically</li>
        </ul>
      </div>
    </>
  );
}

