import React from 'react';
import Image from 'next/image';

type YouTubeBrandIconProps = {
  /**
   * The URL to link to. Required by YouTube branding guidelines.
   * Should be a YouTube content or component link.
   */
  href: string;
  /**
   * Open link in new tab (default: true)
   */
  newTab?: boolean;
  /**
   * Extra class names for layout, not for size or color.
   */
  className?: string;
};

/**
 * YouTubeBrandIcon renders the official YouTube icon as a link, always 24px wide (minimum per guidelines).
 * The clear space required by YouTube should be handled by the parent container (e.g., with margin or gap).
 * This ensures the icon is always the correct, expected size visually.
 */
export const YouTubeBrandIcon: React.FC<YouTubeBrandIconProps> = ({
  className = '',
  href,
  newTab = true,
}) => {
  return (
    <a
      href={href}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
      aria-label="YouTube"
      style={{ display: 'inline-block', lineHeight: 0 }}
      className={`min-w-[20px] min-h-[20px] ${className}`}
    >
      <Image
        src="/youtube-logo.svg"
        alt="YouTube"
        width={80}
        height={56}
        className="w-full h-full"
        style={{ display: 'block' }}
        role="img"
        aria-label="YouTube"
      />
    </a>
  );
};
