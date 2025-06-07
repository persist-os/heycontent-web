import Link from 'next/link'
import React from 'react'

const Footer = () => (
  <footer className="border-t w-full flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6 text-center text-lg bg-white">
    <div className="max-w-6xl w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 sm:gap-8 items-center justify-center text-center">
      <div>
        <h3 className="font-medium mb-4 text-xl">Product</h3>
        <div className="flex flex-col gap-3 text-gray-600 items-center text-center text-lg">
          <button className="hover:text-gray-900 text-left">Overview</button>
          <button className="hover:text-gray-900 text-left">Pricing</button>
          <button className="hover:text-gray-900 text-left">Features</button>
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-4 text-xl">Company</h3>
        <div className="flex flex-col gap-3 text-gray-600 items-center text-center text-lg">
          <Link href="/about" className="hover:text-gray-900 text-left">
            About us
          </Link>
          <button className="hover:text-gray-900 text-left">Careers</button>
          <button className="hover:text-gray-900 text-left">Contact</button>
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-4 text-xl">Legal</h3>
        <div className="flex flex-col gap-3 text-gray-600 items-center text-center text-lg">
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
      <div>
        <h3 className="font-medium mb-4 text-xl">Resources</h3>
        <div className="flex flex-col gap-3 text-gray-600 items-center text-center text-lg">
          <a href="/docs" className="hover:text-gray-900 text-left">Docs</a>
          <a href="/support" className="hover:text-gray-900 text-left">Support</a>
          <a href="/status" className="hover:text-gray-900 text-left">API Status</a>
        </div>
      </div>
    </div>
  </footer>
)

export default Footer 