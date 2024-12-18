import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
        Ava Iris
      </span>
    </Link>
  )
}