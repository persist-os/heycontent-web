import { useState } from 'react'
import Link from 'next/link'

export function TestButtons() {
  const [clicked, setClicked] = useState('')

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-lg font-bold">Test Buttons</h2>
      
      {/* Instagram Link */}
      <Link 
        href="/api/social/instagram/auth-url"
        className="block w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-center"
      >
        Test Instagram Link
      </Link>

      {/* YouTube Link */}
      <Link 
        href="/api/social/youtube/auth-url"
        className="block w-full p-4 bg-red-600 text-white rounded-lg text-center"
      >
        Test YouTube Link
      </Link>

      {/* Regular Link */}
      <Link 
        href="/settings"
        className="block w-full p-4 bg-blue-600 text-white rounded-lg text-center"
      >
        Test Regular Link
      </Link>
    </div>
  )
} 