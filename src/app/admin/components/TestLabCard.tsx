import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TestLabCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badgeText?: string;
  href?: string;
  onClick?: () => void;
  colorVariant?: 'primary' | 'purple' | 'blue' | 'green';
}

const colorClasses = {
  primary: 'border-primary/30 bg-gradient-to-br from-primary/5 to-background',
  purple: 'border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-background dark:from-purple-500/10 dark:to-background',
  blue: 'border-chart-2/30 bg-gradient-to-br from-chart-2/5 to-background dark:from-chart-2/10 dark:to-background',
  green: 'border-accent/30 bg-gradient-to-br from-accent/5 to-background dark:from-accent/10 dark:to-background',
};

const iconColorClasses = {
  primary: 'text-primary',
  purple: 'text-purple-600 dark:text-purple-400',
  blue: 'text-chart-2',
  green: 'text-accent',
};

export function TestLabCard({
  title,
  description,
  icon: Icon,
  badgeText,
  href,
  onClick,
  colorVariant = 'primary',
}: TestLabCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <Card className={`${colorClasses[colorVariant]} bg-card/50 backdrop-blur-sm`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${iconColorClasses[colorVariant]}`} />
              <CardTitle className="text-xl">{title}</CardTitle>
              {badgeText && <Badge className="text-xs">{badgeText}</Badge>}
            </div>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
          {(href || onClick) && (
            <Button onClick={handleClick} className="gap-2">
              Open
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}

