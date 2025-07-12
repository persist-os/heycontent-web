import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Mail, Handshake, Tv, Briefcase, Users } from 'lucide-react';
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

const iconMap = {
  Handshake,
  Tv,
  Briefcase,
  Users,
  Mail
};

export const CategoryEmailList: React.FC<CategoryEmailListProps> = ({
  partnerships,
  groupedEmails,
  expandedCategories,
  onToggleCategory,
  onSelectPartnership,
  selectedPartnershipId
}) => {
  // Create partnership lookup map for O(1) lookups instead of O(n) find operations
  const partnershipMap = React.useMemo(() => {
    const map: Record<string, Partnership> = {};
    partnerships.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [partnerships]);

  if (partnerships.length === 0) {
    return (
      <div className="text-center py-8 md:py-12 px-4">
        <div className="p-3 md:p-4 rounded-full bg-muted mx-auto mb-4 w-fit">
          <Mail className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base md:text-lg font-medium text-foreground mb-2">Your inbox is ready for amazing things</h3>
        <p className="text-sm md:text-base text-muted-foreground mb-4 max-w-md mx-auto">
          No partnership opportunities found yet? That just means you're about to discover some incredible collaborations! 
          Keep creating, keep connecting – your next big partnership is probably already in your inbox waiting to be found.
        </p>
        <p className="text-xs md:text-sm text-muted-foreground">
          Try refreshing your Gmail to uncover potential partnerships, or keep being awesome – opportunities love great creators
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {Object.entries(groupedEmails).map(([category, categoryEmails]) => {
        const emails = categoryEmails as any[];
        if (emails.length === 0) return null;
        
        const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.uncategorized;
        const IconComponent = iconMap[config.icon as keyof typeof iconMap] || Mail;
        
        return (
          <div key={category} className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Category Header */}
            <div className="bg-muted/50 px-3 md:px-4 py-2 md:py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                  <IconComponent className={`w-4 h-4 md:w-5 md:h-5 ${config.color} flex-shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-sm md:text-base font-semibold ${config.color} truncate`}>
                      {config.title}
                    </h3>
                    <p className="text-xs text-muted-foreground hidden md:block">{config.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {emails.length}
                  </Badge>
                </div>
                <button
                  onClick={() => onToggleCategory(category)}
                  className="text-muted-foreground hover:text-foreground text-sm ml-2 p-1 transition-colors"
                  aria-label={expandedCategories[category] ? 'Collapse category' : 'Expand category'}
                >
                  {expandedCategories[category] ? '▼' : '▶'}
                </button>
              </div>
            </div>
            
            {/* Category Emails */}
            {expandedCategories[category] && (
              <div className="divide-y divide-border">
                {emails.map((email) => {
                  const partnership = partnershipMap[email.id];
                  if (!partnership) return null;
                  
                  return (
                    <EmailItem
                      key={email.id}
                      email={email}
                      partnership={partnership}
                      config={config}
                      isSelected={selectedPartnershipId === partnership.id}
                      onSelect={() => onSelectPartnership(partnership)}
                    />
                  );
                })}
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
      className={`p-3 md:p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
        isSelected ? `bg-muted border-l-4 ${config.color.replace('text-', 'border-').replace(' dark:text-', ' dark:border-')}` : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="text-sm font-medium text-foreground truncate flex-1">
              {email.content?.data?.subject || 'No Subject'}
            </h4>
            <Badge variant="outline" className={`text-xs flex-shrink-0 ${isSelected ? config.color : 'text-muted-foreground'}`}>
              {email.convexData?.category || email.category || 'uncategorized'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2 truncate">
            From: {partnership.brandName}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {email.content?.data?.snippet || 'No preview available'}
          </p>
          {partnership.estimatedValue > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-2">
              ${partnership.estimatedValue.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 