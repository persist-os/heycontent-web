'use client'

import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

interface WaitlistButtonProps {
  size?: 'default' | 'large'
}

export function WaitlistButton({ size = 'default' }: WaitlistButtonProps) {
  const router = useRouter()
  const pathname = usePathname();

  const sizeStyles = {
    default: {
      button: 'px-4 py-2 text-sm',
      glow: {
        inset: '-4px',
        border: '2px dashed #fde047',
        boxShadow: '0 0 8px 1px #fde04788',
      }
    },
    large: {
      button: 'px-8 py-4 text-base',
      glow: {
        inset: '-6px',
        border: '2.5px dashed #fde047',
        boxShadow: '0 0 12px 2px #fde04788',
      }
    }
  }

  const currentSize = sizeStyles[size]

  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      // Always navigate to /waitlist without redirecting to chat
      if (pathname !== '/waitlist') {
        await router.push('/waitlist');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      drag
      dragMomentum={false}
      onClick={handleClick}
      disabled={isLoading}
      className={`${currentSize.button} font-bold rounded-full shadow-lg relative border-2 border-dashed border-yellow-400 ${
        isLoading ? 'opacity-70 cursor-not-allowed' : ''
      }`}
      style={{
        background: 'linear-gradient(120deg, #232526 0%, #414345 40%, #111 100%)',
        color: 'white',
        opacity: 1,
        boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
        zIndex: 1,
      }}
      whileHover={isLoading ? {} : { scale: size === 'large' ? 1.07 : 1.05 }}
      whileTap={isLoading ? {} : { scale: 0.97 }}
    >
      {/* Glowing dashed border effect */}
      <span
        aria-hidden
        style={{
          content: '""',
          position: 'absolute',
          ...currentSize.glow,
          borderRadius: '9999px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <span style={{ position: 'relative', zIndex: 2 }}>
        {isLoading ? 'Loading...' : 'Get Early Access'}
      </span>
    </motion.button>
  )
} 