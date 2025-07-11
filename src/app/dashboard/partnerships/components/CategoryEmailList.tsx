import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Mail } from 'lucide-react';
import { Partnership } from '../types';
import { categoryConfig } from '../utils/emailCategorization';

interface CategoryEmailListProps {
  partnerships: Partnership[];
  groupedEmails: Record<string, any[]>;
  expandedCategories: Record<string, boolean>;
  onToggleCategory: (category: string) => void;
  onSelectPartnership: (partnership: Partnership) => void;
  selectedPartnershipId?: string;
}

export const CategoryEmailList: React.FC<CategoryEmailListProps> = ({
  partnerships,
  groupedEmails,
  expandedCategories,
  onToggleCategory,
  onSelectPartnership,
  selectedPartnershipId
}) => {
  if (partnerships.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 rounded-full bg-muted mx-auto mb-4 w-fit">
          <Mail className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Your inbox is ready for amazing things</h3>
        <p className="text-muted-foreground mb-4">
          No partnership opportunities found yet? That just means you're about to discover some incredible collaborations! 
          Keep creating, keep connecting – your next big partnership is probably already in your inbox waiting to be found.
        </p>
        <p className="text-sm text-muted-foreground">
          Try refreshing your Gmail to uncover potential partnerships, or keep being awesome – opportunities love great creators
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedEmails).map(([category, categoryEmails]) => {
        const emails = categoryEmails as any[];
        if (emails.length === 0) return null;
        
        const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.uncategorized;
        
        return (
          <div key={category} className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Category Header */}
            <div className="bg-muted px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{config.icon}</span>
                  <div>
                    <h3 className={`text-sm font-semibold ${config.color}`}>
                      {config.title} ({emails.length})
                    </h3>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
                                  <button
                    onClick={() => onToggleCategory(category)}
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                  {expandedCategories[category] ? '▼' : '▶'}
                </button>
              </div>
            </div>
            
            {/* Category Emails */}
            {expandedCategories[category] && (
              <div className="divide-y divide-border">
                {emails.slice(0, 5).map((email: any, index: number) => {
                  const partnership = partnerships.find(p => p.id === email.id);
                  if (!partnership) return null;
                  
                  return (
                    <EmailItem
                      key={email.id || index}
                      email={email}
                      partnership={partnership}
                      config={config}
                      isSelected={selectedPartnershipId === email.id}
                      onSelect={() => onSelectPartnership(partnership)}
                    />
                  );
                })}
                {emails.length > 5 && (
                  <div className="p-2 text-center">
                    <button className="text-xs text-primary hover:text-primary/80">
                      View {emails.length - 5} more...
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface EmailItemProps {
  email: any;
  partnership: Partnership;
  config: any;
  isSelected: boolean;
  onSelect: () => void;
}

const EmailItem: React.FC<EmailItemProps> = ({ email, partnership, config, isSelected, onSelect }) => {
  return (
    <div 
      className={`p-3 hover:bg-muted/50 cursor-pointer ${
        isSelected ? 'bg-primary/10 border-l-2 border-primary' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="text-xs font-medium text-foreground truncate">
              {email.content?.data?.subject || 'No Subject'}
            </h4>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${config.color} bg-opacity-10`}>
              {email.convexData?.category || email.category || 'uncategorized'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            From: {partnership.brandName}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {email.content?.data?.snippet || 'No preview available'}
          </p>
          {partnership.estimatedValue > 0 && (
            <p className="text-xs text-success font-medium mt-1">
              ${partnership.estimatedValue.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 