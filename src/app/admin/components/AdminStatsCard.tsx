import { BaseCard } from '@/components/ui/base-card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminStatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  onClick?: () => void;
  active?: boolean;
}

export function AdminStatsCard({ label, value, icon: Icon, onClick, active }: AdminStatsCardProps) {
  return (
    <BaseCard
      variant="admin-stats"
      title={label}
      onClick={onClick}
      className={cn(
        "transition-all cursor-pointer hover:shadow-md",
        active ? 'ring-2 ring-primary' : ''
      )}
    >
      <div className="flex items-center justify-between mt-3">
        <div className="text-2xl font-bold">{value}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
    </BaseCard>
  );
}

