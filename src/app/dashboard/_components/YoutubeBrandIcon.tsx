import React from 'react';

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
      className={className}
    >
      <svg
        viewBox="0 0 90 63"
        width="100%"
        height="100%"
        style={{ minWidth: 20, minHeight: 20, display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="YouTube"
        focusable="false"
      >
        <rect x="0" y="0" width="90" height="63" rx="14" fill="#FF0000" />
        <polygon points="36,16 36,47 67,31.5" fill="#FFFFFF" />
      </svg>
    </a>
  );
};
