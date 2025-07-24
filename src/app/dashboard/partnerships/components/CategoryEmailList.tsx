import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Mail, Handshake, Tv, Briefcase, Users, ChevronDown, ChevronRight } from 'lucide-react';
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

// Custom colors for each category with 11% transparency for headers
const categoryColors = {
  partnership: {
    headerBg: 'bg-[#9D89F7]/[0.11]',
    border: 'border-[#9D89F7]/20',
    glow: 'shadow-lg shadow-[#9D89F7]/20',
    text: 'text-[#9D89F7]',
    accent: 'border-l-[#9D89F7]',
    dot: 'bg-[#9D89F7]',
    badgeBg: 'bg-[#9D89F7]',
    badgeText: 'text-white'
  },
  media: {
    headerBg: 'bg-[#FF96FB]/[0.11]',
    border: 'border-[#FF96FB]/20',
    glow: 'shadow-lg shadow-[#FF96FB]/20',
    text: 'text-[#FF96FB]',
    accent: 'border-l-[#FF96FB]',
    dot: 'bg-[#FF96FB]',
    badgeBg: 'bg-[#FF96FB]',
    badgeText: 'text-white'
  },
  business: {
    headerBg: 'bg-[#40E3FF]/[0.11]',
    border: 'border-[#40E3FF]/20',
    glow: 'shadow-lg shadow-[#40E3FF]/20',
    text: 'text-[#40E3FF]',
    accent: 'border-l-[#40E3FF]',
    dot: 'bg-[#40E3FF]',
    badgeBg: 'bg-[#40E3FF]',
    badgeText: 'text-black'
  },
  community: {
    headerBg: 'bg-[#9BE7B2]/[0.11]',
    border: 'border-[#9BE7B2]/20',
    glow: 'shadow-lg shadow-[#9BE7B2]/20',
    text: 'text-[#9BE7B2]',
    accent: 'border-l-[#9BE7B2]',
    dot: 'bg-[#9BE7B2]',
    badgeBg: 'bg-[#9BE7B2]',
    badgeText: 'text-black'
  }
};

const formatDate = (dateString: string | number) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  };
  
  return date.toLocaleDateString('en-US', options);
};

const getStatusBadgeVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'opportunity':
      return 'default';
    case 'inquiry':
      return 'default';
    case 'negotiating':
      return 'default';
    case 'active':
      return 'default';
    default:
      return 'outline';
  }
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
      <div className="text-center py-12 px-4 rounded-lg">
        <div className="p-4 rounded-full bg-muted mx-auto mb-4 w-fit">
          <Mail className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Ready to dive into your next collaboration?</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          Pick a partnership from the left to explore the conversation, draft replies, and turn opportunities into collaborations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg">
      {Object.entries(groupedEmails).map(([category, categoryEmails]) => {
        const emails = categoryEmails as any[];
        if (emails.length === 0) return null;
        
        const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.uncategorized;
        const colors = categoryColors[category as keyof typeof categoryColors];
        const isExpanded = expandedCategories[category];
        
        return (
          <div key={category} className="border border-border rounded-lg">
            {/* Category Header with 11% transparency */}
            <div 
              className={`px-4 py-3 cursor-pointer rounded-lg ${colors ? `${colors.headerBg}` : 'bg-muted/50'}`}
              onClick={() => onToggleCategory(category)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className={`text-sm font-medium ${colors ? colors.text : 'text-foreground'}`}>
                    {config.title}
                  </h3>
                  <Badge 
                    variant="outline" 
                    className={`text-xs rounded-full border-0 ${
                      colors 
                        ? `${colors.badgeBg} ${colors.badgeText}` 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {emails.length}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {isExpanded ? (
                    <ChevronDown className={`w-3 h-3 ${colors ? colors.text : 'text-muted-foreground'}`} />
                  ) : (
                    <ChevronRight className={`w-3 h-3 ${colors ? colors.text : 'text-muted-foreground'}`} />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
            </div>
            
            {/* Category Emails with theme colors */}
            {isExpanded && (
              <div className="bg-card rounded-lg">
                {emails.map((email) => {
                  const partnership = partnershipMap[email.id];
                  if (!partnership) return null;
                  
                  return (
                    <EmailItem
                      key={email.id}
                      email={email}
                      partnership={partnership}
                      config={config}
                      colors={colors}
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
  colors?: any;
  isSelected: boolean;
  onSelect: () => void;
}

const EmailItem: React.FC<EmailItemProps> = ({ email, partnership, config, colors, isSelected, onSelect }) => {
  return (
    <div 
      className={`px-4 py-5 cursor-pointer transition-all duration-200 border-b border-border/50 last:border-b-0 rounded-lg ${
        isSelected ? 'bg-muted/30' : 'hover:bg-muted/10'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Colored dot */}
        <div className={`w-2 h-2 rounded-full mt-2 ${colors ? colors.dot : 'bg-muted-foreground'} flex-shrink-0`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            {/* Left side - Company name, subject, and description */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <h4 className="text-sm font-medium text-foreground mb-1 truncate">
                {partnership.brandName}
              </h4>
              <p className="text-sm font-medium text-foreground mb-2 truncate">
                {email.content?.data?.subject || 'No Subject'}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 break-words overflow-hidden">
                {email.content?.data?.snippet || 'No preview available'}
              </p>
            </div>
            
            {/* Right side - Date and status */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-3">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(partnership.lastActivity)}
              </span>
              <Badge 
                variant="outline"
                className={`text-xs whitespace-nowrap border-0 rounded-full ${
                  colors 
                    ? `${colors.badgeBg} ${colors.badgeText}` 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {partnership.status.charAt(0).toUpperCase() + partnership.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 