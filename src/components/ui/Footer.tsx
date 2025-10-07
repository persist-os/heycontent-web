import Link from 'next/link'
import React from 'react'

const Footer = () => (
  <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 py-12 sm:py-16">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
        <div className="sm:col-span-2 lg:col-span-2">
          <h3 className="text-xl sm:text-2xl font-light text-slate-100 mb-3 sm:mb-4">HeyContext</h3>
          <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed max-w-md">
            A private space for thinking and working. Your thoughts, connected across time, 
            never lost, always yours.
          </p>
        </div>
        
        <div>
          <h4 className="text-slate-100 font-medium mb-4 sm:mb-6 text-xs sm:text-sm uppercase tracking-wide">Product</h4>
          <div className="space-y-3 sm:space-y-4">
            <Link href="/about" className="block text-sm sm:text-base text-slate-400 hover:text-slate-200 active:text-slate-100 transition-colors font-light touch-manipulation">
              About
            </Link>
            <Link href="/legal/privacy" className="block text-sm sm:text-base text-slate-400 hover:text-slate-200 active:text-slate-100 transition-colors font-light touch-manipulation">
              Privacy
            </Link>
            <Link href="/legal/security" className="block text-sm sm:text-base text-slate-400 hover:text-slate-200 active:text-slate-100 transition-colors font-light touch-manipulation">
              Security
            </Link>
          </div>
        </div>
        
        <div>
          <h4 className="text-slate-100 font-medium mb-4 sm:mb-6 text-xs sm:text-sm uppercase tracking-wide">Support</h4>
          <div className="space-y-3 sm:space-y-4">
            <a 
              href="https://discord.gg/PgfZpFeVHW" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block text-sm sm:text-base text-slate-400 hover:text-slate-200 active:text-slate-100 transition-colors font-light touch-manipulation"
            >
              Community
            </a>
            <a href="mailto:hello@heycontext.ai" className="block text-sm sm:text-base text-slate-400 hover:text-slate-200 active:text-slate-100 transition-colors font-light touch-manipulation">
              Contact
            </a>
            <Link href="/legal/terms" className="block text-sm sm:text-base text-slate-400 hover:text-slate-200 active:text-slate-100 transition-colors font-light touch-manipulation">
              Terms
            </Link>
          </div>
        </div>
      </div>
      
      <div className="border-t border-slate-800 mt-8 sm:mt-12 pt-6 sm:pt-8">
        <p className="text-slate-500 text-xs sm:text-sm font-light">
          © 2025 PersistOS. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
)

export default Footer