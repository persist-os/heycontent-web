interface ShortcutHelpItem {
  key: string;
  description: string;
  example?: string;
}

const SHORTCUTS: ShortcutHelpItem[] = [
  { key: '/', description: 'Open command menu', example: '/capture, /save' },
  { key: '@', description: 'Reference content', example: '@conversation, @insight' },
  { key: '#', description: 'Add tag', example: '#content, #idea' },
  { key: '⌘ + S', description: 'Save note' },
  { key: '⌘ + K', description: 'Quick capture' },
  { key: '⌘ + F', description: 'Search' },
  { key: 'Esc', description: 'Cancel current command' }
];

export function ShortcutsHelp() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      <h3 className="font-medium mb-4">Keyboard Shortcuts</h3>
      <div className="space-y-2">
        {SHORTCUTS.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between">
            <div>
              <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                {shortcut.key}
              </code>
              <span className="ml-2 text-gray-600">{shortcut.description}</span>
            </div>
            {shortcut.example && (
              <span className="text-sm text-gray-400">{shortcut.example}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 