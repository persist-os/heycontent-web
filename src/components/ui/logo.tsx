import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  size?: 'small' | 'medium' | 'large'
  disableLink?: boolean
}

export function Logo({ className = '', size = 'medium', disableLink = false }: LogoProps) {
  const logoMap = {
    small: '/heycontext-small-square.svg',
    medium: '/heycontext-medium-square.svg',
    large: '/heycontext-large-square.svg'
  }

  const logoImage = (
    <div className="rounded-lg bg-background border border-border p-1 shadow-sm">
      <Image
        src={logoMap[size]}
        alt="HeyContext Logo"
        width={size === 'small' ? 24 : size === 'medium' ? 32 : 48}
        height={size === 'small' ? 24 : size === 'medium' ? 32 : 48}
        className="transition-transform duration-300 hover:scale-105"
        priority
      />
    </div>
  )

  if (disableLink) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {logoImage}
      </div>
    )
  }

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} tabIndex={0} aria-label="Go to landing page">
      {logoImage}
    </Link>
  )
}