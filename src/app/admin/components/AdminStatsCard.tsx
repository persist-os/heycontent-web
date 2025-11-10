import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AdminStatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  onClick?: () => void;
  active?: boolean;
}

export function AdminStatsCard({ label, value, icon: Icon, onClick, active }: AdminStatsCardProps) {
  return (
    <Card
      className={`transition-all cursor-pointer hover:shadow-md ${
        active ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

