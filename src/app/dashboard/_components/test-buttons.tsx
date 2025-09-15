import { useState } from 'react'
import Link from 'next/link'

export function TestButtons() {
  const [clicked, setClicked] = useState('')

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-lg font-bold">Test Buttons</h2>
      

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