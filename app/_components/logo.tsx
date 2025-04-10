import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  size?: 'small' | 'medium' | 'large'
}

export function Logo({ className = '', size = 'medium' }: LogoProps) {
  const logoMap = {
    small: '/hey-content-small-square.svg',
    medium: '/hey-content-medium-square.svg',
    large: '/hey-content-large-square.svg'
  }

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="rounded-2xl bg-white p-1 shadow-sm">
        <Image
          src={logoMap[size]}
          alt="HeyContent Logo"
          width={size === 'small' ? 32 : size === 'medium' ? 48 : 64}
          height={size === 'small' ? 32 : size === 'medium' ? 48 : 64}
          className="transition-transform duration-300 hover:scale-105"
        />
      </div>
    </Link>
  )
}