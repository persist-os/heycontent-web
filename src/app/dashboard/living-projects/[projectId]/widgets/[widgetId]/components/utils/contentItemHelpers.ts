import { FileText, Package, Sparkles, Gem, LucideIcon } from 'lucide-react';
import { ContentType } from '../types/contentAttachment';

export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function getItemIcon(type: ContentType): LucideIcon {
  switch (type) {
    case 'note':
      return FileText;
    case 'artifact':
      return Package;
    case 'stardust':
      return Sparkles;
    case 'shard':
      return Gem;
    default:
      return FileText;
  }
}

export function truncatePreview(content: string, maxLength: number = 150): string {
  if (!content) return '';
  return content.length > maxLength ? content.substring(0, maxLength) : content;
}
