import Link from 'next/link'
import React from 'react'

const Footer = () => (
  <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 py-16">
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <h3 className="text-2xl font-light text-slate-100 mb-4">HeyContext</h3>
          <p className="text-slate-400 font-light leading-relaxed max-w-md">
            A private space for thinking and working. Your thoughts, connected across time, 
            never lost, always yours.
          </p>
        </div>
        
        <div>
          <h4 className="text-slate-100 font-medium mb-6 text-sm uppercase tracking-wide">Product</h4>
          <div className="space-y-4">
            <Link href="/about" className="block text-slate-400 hover:text-slate-200 transition-colors font-light">
              About
            </Link>
            <Link href="/legal/privacy" className="block text-slate-400 hover:text-slate-200 transition-colors font-light">
              Privacy
            </Link>
            <Link href="/legal/security" className="block text-slate-400 hover:text-slate-200 transition-colors font-light">
              Security
            </Link>
          </div>
        </div>
        
        <div>
          <h4 className="text-slate-100 font-medium mb-6 text-sm uppercase tracking-wide">Support</h4>
          <div className="space-y-4">
            <a href="mailto:hello@heycontext.ai" className="block text-slate-400 hover:text-slate-200 transition-colors font-light">
              Contact
            </a>
            <Link href="/legal/terms" className="block text-slate-400 hover:text-slate-200 transition-colors font-light">
              Terms
            </Link>
          </div>
        </div>
      </div>
      
      <div className="border-t border-slate-800 mt-12 pt-8">
        <p className="text-slate-500 text-sm font-light">
          © 2025 PersistOs. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
)

export default Footer