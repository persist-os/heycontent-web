import React from 'react';

export function Instructions() {
  return (
    <div className="space-y-12 max-w-3xl">
      {/* Step 1: Export */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-4">
          <h3 className="text-2xl font-light tracking-tight">Step 1</h3>
          <div className="h-px bg-border/30 flex-1 mb-2" />
        </div>
        <p className="text-lg font-medium">Export your data from ChatGPT</p>
        <ol className="space-y-3 ml-6">
          <li className="text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">1.</span> Go to{' '}
            <a 
              href="https://chat.openai.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-foreground underline hover:text-muted-foreground transition-colors"
            >
              chat.openai.com
            </a>
          </li>
          <li className="text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">2.</span> Click your profile picture → Settings → Data Controls
          </li>
          <li className="text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">3.</span> Under Data Export, click <span className="font-medium text-foreground">Export Data</span>
          </li>
          <li className="text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">4.</span> Wait for the email (usually takes a few hours)
          </li>
          <li className="text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">5.</span> Download the .zip file and unzip it
          </li>
          <li className="text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">6.</span> Find the file called{' '}
            <code className="font-mono text-foreground bg-muted px-2 py-0.5 rounded">conversations.json</code>
          </li>
        </ol>
      </div>

      {/* Step 2: Compress */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-4">
          <h3 className="text-2xl font-light tracking-tight">Step 2</h3>
          <div className="h-px bg-border/30 flex-1 mb-2" />
        </div>
        <p className="text-lg font-medium">Compress the file</p>
        <div className="space-y-6 ml-6">
          <p className="text-muted-foreground leading-relaxed">
            Right-click the <code className="font-mono text-foreground bg-muted px-2 py-0.5 rounded">conversations.json</code> file:
          </p>
          
          <div className="space-y-4 border-l-2 border-border/30 pl-6">
            <div>
              <p className="font-medium mb-2">On Mac</p>
              <ol className="space-y-2">
                <li className="text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">1.</span> Right-click → Compress "conversations.json"
                </li>
                <li className="text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">2.</span> Mac creates{' '}
                  <code className="font-mono text-foreground bg-muted px-2 py-0.5 rounded">conversations.json.zip</code>
                </li>
              </ol>
            </div>

            <div>
              <p className="font-medium mb-2">On Windows</p>
              <ol className="space-y-2">
                <li className="text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">1.</span> Right-click → Send to → Compressed (zipped) folder
                </li>
                <li className="text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">2.</span> Windows creates{' '}
                  <code className="font-mono text-foreground bg-muted px-2 py-0.5 rounded">conversations.json.zip</code>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Upload */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-4">
          <h3 className="text-2xl font-light tracking-tight">Step 3</h3>
          <div className="h-px bg-border/30 flex-1 mb-2" />
        </div>
        <p className="text-lg font-medium">Upload the file</p>
        <div className="ml-6 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Use the upload button below. The filename must be exactly:
          </p>
          <div className="border-l-2 border-foreground pl-6 py-2">
            <code className="text-xl font-mono font-medium tracking-tight">
              conversations.json.zip
            </code>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Don't rename it. If the filename is different, the upload won't work.
          </p>
        </div>
      </div>

      {/* What Happens */}
      <div className="space-y-3 pt-6 border-t border-border/30">
        <p className="text-sm font-medium">After you upload:</p>
        <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <li>Your conversations are processed in the background</li>
          <li>Both your messages and ChatGPT's responses are saved</li>
          <li>Content is added to your library automatically</li>
          <li>You can track progress on this page</li>
        </ul>
      </div>
    </div>
  );
}

