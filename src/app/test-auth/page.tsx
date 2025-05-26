'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/app/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

export default function TestAuthPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    }, (error) => {
      console.error('Auth state error:', error)
      setError(error.message)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const testGmailAuth = async () => {
    try {
      const response = await fetch('/api/social/auth-url?platform=gmail')
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
        return
      }
      
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Error testing Gmail auth:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Firebase Auth Test</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      ) : user ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p><strong>User ID:</strong> {user.uid}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Display Name:</strong> {user.displayName || 'N/A'}</p>
          <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Not authenticated. Please log in.</p>
        </div>
      )}

      <div className="mt-4">
        <h2 className="text-xl font-bold mb-2">Test Gmail Auth</h2>
        <button 
          onClick={testGmailAuth}
          disabled={!user}
          className={`px-4 py-2 rounded ${!user ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
        >
          Connect Gmail
        </button>
        {!user && <p className="text-sm text-gray-500 mt-2">You need to be logged in to test Gmail auth</p>}
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-bold mb-2">Debug Info</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify({ user: user ? { 
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified,
            providerId: user.providerId,
            providerData: user.providerData
          } : null }, null, 2)}
        </pre>
      </div>
    </div>
  )
}
