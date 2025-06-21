import { format } from 'date-fns';
import { SearchResultItemProps } from './types';

function highlight(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-yellow-200 rounded px-1">{part}</span>
    ) : (
      part
    )
  );
}

export function SearchResultItem({ result, isActive, onSelect, searchQuery }: SearchResultItemProps) {
  const Icon = result.icon;
  
  const renderPreview = () => {
    switch (result.type) {
      case 'conversation':
        return (
          <div className="text-sm text-muted-foreground">
            {searchQuery ? highlight(result.lastMessage, searchQuery) : result.lastMessage}
            <div className="text-xs text-muted-foreground/80 mt-1">
              with {result.participants.join(', ')}
            </div>
          </div>
        );
      case 'conversation_history':
        return (
          <div className="text-sm text-muted-foreground">
            {searchQuery ? highlight(result.preview, searchQuery) : result.preview}
            <div className="text-xs text-muted-foreground/80 mt-1">
              with {result.participants.join(', ')}
              <span className="ml-2">
                → {format(new Date(result.timestamp), 'MMM d, h:mm a')}
              </span>
            </div>
          </div>
        );
      case 'note':
        return (
          <div className="text-sm text-muted-foreground">
            {searchQuery ? highlight(result.preview, searchQuery) : result.preview}
            <div className="flex gap-2 mt-1">
              {result.tags.map(tag => (
                <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{result.metric}:</span> {result.value}
            <span className={`ml-2 ${
              result.trend === 'up' ? 'text-primary' : 
              result.trend === 'down' ? 'text-destructive' : 
              'text-muted-foreground'
            }`}>
              {result.trend === 'up' ? '↑' : result.trend === 'down' ? '↓' : '→'}
            </span>
          </div>
        );
      case 'insight':
        return (
          <div className="text-sm text-muted-foreground">
            {searchQuery ? highlight(result.summary, searchQuery) : result.summary}
            <div className="text-xs text-muted-foreground/80 mt-1">{result.category}</div>
          </div>
        );
      case 'audience':
        return (
          <div className="text-sm text-muted-foreground">
            <div>{result.segment}</div>
            <div className="flex gap-4 text-xs text-muted-foreground/80 mt-1">
              {result.metrics.map(metric => (
                <span key={metric.label}>
                  {metric.label}: <span className="text-foreground">{metric.value}</span>
                </span>
              ))}
            </div>
          </div>
        );
      case 'partnership':
        return (
          <div className="text-sm text-muted-foreground">
            <div>{result.company} — {result.details}</div>
            <div className="text-xs mt-1">
              <span className={`
                px-2 py-0.5 rounded-full
                ${result.status === 'active' ? 'bg-primary/10 text-primary' :
                  result.status === 'pending' ? 'bg-secondary text-secondary-foreground' :
                  'bg-muted text-muted-foreground'}
              `}>
                {result.status}
              </span>
            </div>
          </div>
        );
    }
  };

  return (
    <button
      className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-accent/10 transition-colors ${
        isActive ? 'bg-accent/10' : ''
      }`}
      onClick={onSelect}
    >
      <div className="pt-1">
        <Icon className={`w-5 h-5 ${result.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-base font-medium">
            {searchQuery ? highlight(result.title, searchQuery) : result.title}
          </span>
          <span className="text-xs text-muted-foreground/80 whitespace-nowrap ml-4">
            {format(new Date(
              result.type === 'conversation_history' && 'timestamp' in result ? result.timestamp : result.updatedAt
            ), 'MMM d')}
          </span>
        </div>
        {renderPreview()}
      </div>
    </button>
  );
} 