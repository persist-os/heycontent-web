import React, { useState } from 'react';
import { FileText, Youtube, Mail, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Message } from '@/types/chat';

interface VectorSearchContextProps {
  vectorSearchMetadata: Message['vector_search_metadata'];
}

const ContentTypeIcon = ({ contentType }: { contentType: string }) => {
  switch (contentType) {
    case 'note':
      return <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />;
    case 'youtube_video':
      return <Youtube className="w-4 h-4 text-gray-500 flex-shrink-0" />;
    case 'gmail_thread':
      return <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />;
    case 'conversation':
      return <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />;
    default:
      return <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />;
  }
};

const VectorSearchContext: React.FC<VectorSearchContextProps> = ({ vectorSearchMetadata }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  if (!vectorSearchMetadata || !vectorSearchMetadata.foundRelevantContent || vectorSearchMetadata.relevantContent.length === 0) {
    return null;
  }

  const toggleItem = (index: number) => {
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const relevantContent = vectorSearchMetadata.relevantContent;

  return (
    <div className="mb-3 border border-gray-200 bg-gray-50/70 rounded-lg">
      <button 
        className="w-full flex justify-between items-center p-3 text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="text-xs font-semibold text-gray-600">
          Drawing context from {relevantContent.length} item{relevantContent.length > 1 ? 's' : ''}
        </h4>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3">
          <ul className="space-y-1">
            {relevantContent.map((item, index) => {
              const isItemExpanded = expandedItems[index];
              return (
                <li key={index} className="text-xs text-gray-800 bg-white/50 border border-gray-200/80 rounded-md p-2">
                  <div className="flex items-start space-x-2">
                    <ContentTypeIcon contentType={item.contentType} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium" title={item.title}>{item.title}</p>
                      {item.summary && (
                        <p className={`mt-1 text-gray-600 ${!isItemExpanded ? 'line-clamp-2' : ''}`}>
                          {item.summary}
                        </p>
                      )}
                    </div>
                  </div>
                  {item.summary && item.summary.length > 100 && (
                    <button
                      onClick={() => toggleItem(index)}
                      className="mt-1.5 w-full text-left text-blue-600 hover:text-blue-800 font-medium text-[11px] flex items-center"
                    >
                      {isItemExpanded ? 'Show less' : 'Show more'}
                      {isItemExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VectorSearchContext; 