export function SearchHelp() {
  return (
    <div className="px-4 py-2 text-sm text-muted-foreground">
      <div className="mb-2">Smart Content Search</div>
      <p className="mb-3 text-xs">Search through your conversations, notes, social posts, emails, and more using AI-powered semantic search.</p>
      
      <div className="mb-2">Search filters:</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <code className="text-xs bg-muted px-1 py-0.5 rounded">type:note</code>
          <span className="ml-2">Filter by content type</span>
        </div>
        <div>
          <code className="text-xs bg-muted px-1 py-0.5 rounded">date:2024-01-01..2024-12-31</code>
          <span className="ml-2">Filter by date range</span>
        </div>
        <div>
          <code className="text-xs bg-muted px-1 py-0.5 rounded">tag:social</code>
          <span className="ml-2">Filter by tags</span>
        </div>
        <div>
          <code className="text-xs bg-muted px-1 py-0.5 rounded">status:active</code>
          <span className="ml-2">Filter by status</span>
        </div>
      </div>
    </div>
  );
} 