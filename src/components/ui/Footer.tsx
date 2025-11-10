import Link from 'next/link'
import React from 'react'
import { T } from '@/components/translation'

const Footer = () => (
  <footer className="bg-foreground dark:bg-foreground text-background py-12 sm:py-16">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
        <div className="sm:col-span-2 lg:col-span-2">
          <h3 className="text-xl sm:text-2xl font-light text-background mb-3 sm:mb-4">HeyContext</h3>
          <p className="text-sm sm:text-base text-background/90 font-light leading-relaxed max-w-md">
            <T context="footer.tagline">AI that works for you, not with you.</T>
          </p>
        </div>
        
        <div>
          <h4 className="text-background font-medium mb-4 sm:mb-6 text-xs sm:text-sm uppercase tracking-wide"><T context="footer.section.product">Product</T></h4>
          <div className="space-y-3 sm:space-y-4">
            <Link href="/pricing" className="block text-sm sm:text-base text-background/90 hover:text-background active:text-background transition-colors font-light touch-manipulation">
              <T context="footer.link.pricing">Pricing</T>
            </Link>
            <Link href="/compare" className="block text-sm sm:text-base text-background/90 hover:text-background active:text-background transition-colors font-light touch-manipulation">
              <T context="footer.link.compare">Compare</T>
            </Link>
            <Link href="/about" className="block text-sm sm:text-base text-background/90 hover:text-background active:text-background transition-colors font-light touch-manipulation">
              <T context="footer.link.about">About</T>
            </Link>
            <Link href="/legal/privacy" className="block text-sm sm:text-base text-background/90 hover:text-background active:text-background transition-colors font-light touch-manipulation">
              <T context="footer.link.privacy">Privacy</T>
            </Link>
            <Link href="/legal/security" className="block text-sm sm:text-base text-background/90 hover:text-background active:text-background transition-colors font-light touch-manipulation">
              <T context="footer.link.security">Security</T>
            </Link>
          </div>
        </div>
        
        <div>
          <h4 className="text-background font-medium mb-4 sm:mb-6 text-xs sm:text-sm uppercase tracking-wide"><T context="footer.section.support">Support</T></h4>
          <div className="space-y-3 sm:space-y-4">
            <a 
              href="https://discord.gg/PgfZpFeVHW" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block text-sm sm:text-base text-background/90 hover:text-background active:text-background transition-colors font-light touch-manipulation"
            >
              <T context="footer.link.community">Community</T>
            </a>
            <a href="mailto:hello@persistos.co" className="block text-sm sm:text-base text-background/90 hover:text-background active:text-background transition-colors font-light touch-manipulation">
              <T context="footer.link.contact">Contact</T>
            </a>
            <Link href="/legal/terms" className="block text-sm sm:text-base text-background/90 hover:text-background active:text-background transition-colors font-light touch-manipulation">
              <T context="footer.link.terms">Terms</T>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="border-t border-background/20 mt-8 sm:mt-12 pt-6 sm:pt-8">
        <p className="text-background/80 text-xs sm:text-sm font-light">
          <T context="footer.copyright">© 2025 PersistOS. All rights reserved.</T>
        </p>
      </div>
    </div>
  </footer>
)

export default Footer