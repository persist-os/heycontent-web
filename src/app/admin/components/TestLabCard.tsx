import { BaseCard } from '@/components/ui/base-card';
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
    <BaseCard 
      variant="test-lab" 
      title={title}
      summary={description}
      tag={badgeText}
      onClick={handleClick}
      href={href}
    >
      <div className="flex items-center gap-2 mt-3">
        <Icon className="h-5 w-5 text-primary" />
        {(href || onClick) && (
          <Button onClick={handleClick} className="gap-2 min-h-[44px] md:min-h-0">
            Open
          </Button>
        )}
      </div>
    </BaseCard>
  );
}

