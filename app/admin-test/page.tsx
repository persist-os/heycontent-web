'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/app/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

export default function AdminTestPage() {
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [envInfo, setEnvInfo] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          const token = await user.getIdToken()
          setToken(token)
        } catch (err) {
          console.error('Error getting token:', err)
          setError('Failed to get token')
        }
      } else {
        setToken(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const testAdminVerification = async () => {
    setLoading(true)
    setError(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/auth/admin-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token })
      })

      const data = await response.json()
      setTestResult({
        status: response.status,
        data
      })
    } catch (err) {
      console.error('Admin test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const checkEnvironment = async () => {
    setLoading(true)
    setError(null)
    setEnvInfo(null)

    try {
      const response = await fetch('/api/auth/env-check')
      const data = await response.json()
      setEnvInfo(data)
    } catch (err) {
      console.error('Environment check error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Firebase Admin SDK Test</h1>

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">User Status</h2>
        {user ? (
          <div>
            <p className="text-green-600">✅ Logged in as: {user.email}</p>
            <p className="text-sm mt-2">User ID: {user.uid}</p>
            {token && (
              <div className="mt-2">
                <p className="text-sm font-semibold">ID Token:</p>
                <div className="bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-20 text-xs">
                  {token}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-red-600">❌ Not logged in</p>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={testAdminVerification}
          disabled={loading || !user}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Test Admin Verification
        </button>

        <button
          onClick={checkEnvironment}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          Check Environment
        </button>
      </div>

      {loading && (
        <div className="mb-4 text-blue-600">
          Loading...
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded">
          <h3 className="font-semibold text-red-700">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {testResult && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Test Result:</h3>
          <div className={`p-3 border rounded ${
            testResult.status >= 200 && testResult.status < 300
              ? 'bg-green-100 border-green-300'
              : 'bg-red-100 border-red-300'
          }`}>
            <p className="font-medium">Status: {testResult.status}</p>
            <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-60 text-xs">
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {envInfo && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Environment Info:</h3>
          <div className="p-3 border rounded bg-gray-100">
            <pre className="overflow-auto max-h-60 text-xs">
              {JSON.stringify(envInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
