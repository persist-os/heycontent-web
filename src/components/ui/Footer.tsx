import Link from 'next/link'
import React from 'react'

const Footer = () => (
  <footer className="border-t border-gray-200 w-full flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6 text-center text-lg bg-white light-mode-forced" style={{
    '--background': '0 0% 100%',
    '--foreground': '240 10% 3.9%',
    '--border': '240 5.9% 90%',
    color: '#374151', // Force gray-700 equivalent
    backgroundColor: '#ffffff' // Force white background
  } as React.CSSProperties}>
    <div className="max-w-6xl w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 sm:gap-8 items-center justify-center text-center">
      <div>
        <h3 className="font-medium mb-4 text-xl text-gray-900" style={{ color: '#111827' }}>Product</h3>
        <div className="flex flex-col gap-3 text-gray-600 items-center text-center text-lg">
          <button className="hover:text-gray-900 text-left" style={{ color: '#4b5563' }}>Overview</button>
          <button className="hover:text-gray-900 text-left" style={{ color: '#4b5563' }}>Pricing</button>
          <button className="hover:text-gray-900 text-left" style={{ color: '#4b5563' }}>Features</button>
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-4 text-xl text-gray-900" style={{ color: '#111827' }}>Company</h3>
        <div className="flex flex-col gap-3 text-gray-600 items-center text-center text-lg">
          <Link href="/about" className="hover:text-gray-900 text-left" style={{ color: '#4b5563' }}>
            About us
          </Link>
          <a href="mailto:hello@divertissement.ai" className="hover:text-gray-900 text-left" style={{ color: '#4b5563' }}>Contact</a>
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-4 text-xl text-gray-900" style={{ color: '#111827' }}>Legal</h3>
        <div className="flex flex-col gap-3 text-gray-600 items-center text-center text-lg">
          <Link href="/legal/privacy" className="hover:text-gray-900 text-left" style={{ color: '#4b5563' }}>
            Privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-gray-900 text-left" style={{ color: '#4b5563' }}>
            Terms
          </Link>
          <Link href="/legal/security" className="hover:text-gray-900 text-left" style={{ color: '#4b5563' }}>
            Security
          </Link>
        </div>
      </div>
    </div>
  </footer>
)

export default Footer 