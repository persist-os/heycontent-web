import Link from 'next/link'
import React from 'react'

const Footer = () => (
  <footer className="border-t py-8 sm:py-12 px-4 sm:px-6">
    <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
      <div>
        <h3 className="font-medium mb-4">Product</h3>
        <div className="flex flex-col gap-3 text-gray-600">
          <button className="hover:text-gray-900 text-left">Overview</button>
          <button className="hover:text-gray-900 text-left">Pricing</button>
          <button className="hover:text-gray-900 text-left">Features</button>
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-4">Company</h3>
        <div className="flex flex-col gap-3 text-gray-600">
          <Link href="/about" className="hover:text-gray-900 text-left">
            About us
          </Link>
          <button className="hover:text-gray-900 text-left">Careers</button>
          <button className="hover:text-gray-900 text-left">Contact</button>
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-4">Resources</h3>
        <div className="flex flex-col gap-3 text-gray-600">
          <button className="hover:text-gray-900 text-left">Blog</button>
          <button className="hover:text-gray-900 text-left">Documentation</button>
          <button className="hover:text-gray-900 text-left">Help Center</button>
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-4">Legal</h3>
        <div className="flex flex-col gap-3 text-gray-600">
          <Link href="/legal/privacy" className="hover:text-gray-900 text-left">
            Privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-gray-900 text-left">
            Terms
          </Link>
          <Link href="/legal/security" className="hover:text-gray-900 text-left">
            Security
          </Link>
        </div>
      </div>
    </div>
  </footer>
)

export default Footer 