'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/app/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { AlertCircle, CheckCircle2, Bug, Mail, Youtube, Database } from 'lucide-react'

export default function DebugTab() {
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [envInfo, setEnvInfo] = useState<any>(null)
  const [sessionResult, setSessionResult] = useState<any>(null)
  const [gmailResult, setGmailResult] = useState<any>(null)
  const [youtubeResult, setYoutubeResult] = useState<any>(null)
  const [convexResult, setConvexResult] = useState<any>(null)

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

  const testAuth = async () => {
    setLoading(true)
    setError(null)
    setTestResult(null)

    try {
      // Test the auth endpoint
      const response = await fetch('/api/auth/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      setTestResult({
        status: response.status,
        data
      })
    } catch (err) {
      console.error('Auth test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

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

  const testSession = async () => {
    setLoading(true)
    setError(null)
    setSessionResult(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/auth/session-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token })
      })

      const data = await response.json()
      setSessionResult({
        status: response.status,
        data
      })

      // Reload the page if session was successfully created
      if (data.success && !data.session) {
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (err) {
      console.error('Session test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testGmailConnection = async () => {
    setLoading(true)
    setError(null)
    setGmailResult(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/platforms/gmail/status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      setGmailResult({
        status: response.status,
        data
      })
    } catch (err) {
      console.error('Gmail test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testYoutubeConnection = async () => {
    setLoading(true)
    setError(null)
    setYoutubeResult(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/platforms/youtube/status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      setYoutubeResult({
        status: response.status,
        data
      })
    } catch (err) {
      console.error('YouTube test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testConvexConnection = async () => {
    setLoading(true)
    setError(null)
    setConvexResult(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/debug/convex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token, operation: 'testConnection' })
      })

      const data = await response.json()
      setConvexResult({
        status: response.status,
        data
      })
    } catch (err) {
      console.error('Convex test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testConvexUser = async () => {
    setLoading(true)
    setError(null)
    setConvexResult(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/debug/convex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token, operation: 'getUserInfo' })
      })

      const data = await response.json()
      setConvexResult({
        status: response.status,
        data
      })
    } catch (err) {
      console.error('Convex user test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const createConvexUser = async () => {
    setLoading(true)
    setError(null)
    setConvexResult(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/debug/convex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token, operation: 'createUser' })
      })

      const data = await response.json()
      setConvexResult({
        status: response.status,
        data
      })
    } catch (err) {
      console.error('Convex create user error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getConvexGmailData = async () => {
    setLoading(true)
    setError(null)
    setConvexResult(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/debug/convex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token, operation: 'getGmailData' })
      })

      const data = await response.json()
      setConvexResult({
        status: response.status,
        data
      })
    } catch (err) {
      console.error('Convex Gmail data error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getConvexYoutubeData = async () => {
    setLoading(true)
    setError(null)
    setConvexResult(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/debug/convex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token, operation: 'getYoutubeData' })
      })

      const data = await response.json()
      setConvexResult({
        status: response.status,
        data
      })
    } catch (err) {
      console.error('Convex YouTube data error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Authentication Debugging
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded">
            <h2 className="text-lg font-semibold mb-2">User Status</h2>
            {user ? (
              <div>
                <p className="text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Logged in as: {user.email}
                </p>
                <p className="text-sm mt-2">User ID: {user.uid}</p>
                {token && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">ID Token:</p>
                    <div className="bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-20 text-xs whitespace-pre-wrap break-words">
                      {token}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Not logged in
              </p>
            )}
          </div>

          <Tabs defaultValue="auth-test" className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="w-full md:w-auto flex flex-nowrap">
                <TabsTrigger value="auth-test">Auth Test</TabsTrigger>
                <TabsTrigger value="admin-test">Admin Test</TabsTrigger>
                <TabsTrigger value="session-test">Session</TabsTrigger>
                <TabsTrigger value="env-check">Environment</TabsTrigger>
                <TabsTrigger value="gmail-test">Gmail</TabsTrigger>
                <TabsTrigger value="youtube-test">YouTube</TabsTrigger>
                <TabsTrigger value="convex-test">Convex</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="auth-test">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Test the authentication flow using the standard token verification.
                </p>
                <Button
                  onClick={testAuth}
                  disabled={loading || !user}
                  className="w-full"
                >
                  {loading ? 'Testing...' : 'Test Authentication'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="admin-test">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Test the Firebase Admin SDK token verification.
                </p>
                <Button
                  onClick={testAdminVerification}
                  disabled={loading || !user}
                  className="w-full"
                >
                  {loading ? 'Testing...' : 'Test Admin Verification'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="session-test">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Test and fix session creation with Firebase token.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={testSession}
                    disabled={loading || !user}
                    className="w-full"
                    variant="outline"
                  >
                    {loading ? 'Testing...' : 'Test Session'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This will attempt to diagnose and fix session issues. The page will reload if a fix is applied.
                </p>
              </div>
              {sessionResult && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Session Test Result:</h3>
                  <div className={`p-3 border rounded ${sessionResult.data.success ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                    <p className="font-medium">Status: {sessionResult.status}</p>
                    <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-60 text-xs whitespace-pre-wrap break-words">
                      {JSON.stringify(sessionResult.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="env-check">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Check environment variables and configuration.
                </p>
                <Button
                  onClick={checkEnvironment}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Checking...' : 'Check Environment'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="gmail-test">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Test Gmail API connection and token validity.
                </p>
                <Button
                  onClick={testGmailConnection}
                  disabled={loading || !user}
                  className="w-full"
                  variant="outline"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {loading ? 'Testing...' : 'Test Gmail Connection'}
                </Button>
              </div>
              {gmailResult && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Gmail Test Result:</h3>
                  <div className={`p-3 border rounded ${gmailResult.data.isConnected ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                    <p className="font-medium">Status: {gmailResult.status}</p>
                    <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-60 text-xs whitespace-pre-wrap break-words">
                      {JSON.stringify(gmailResult.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="youtube-test">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Test YouTube API connection and token validity.
                </p>
                <Button
                  onClick={testYoutubeConnection}
                  disabled={loading || !user}
                  className="w-full"
                  variant="outline"
                >
                  <Youtube className="w-4 h-4 mr-2" />
                  {loading ? 'Testing...' : 'Test YouTube Connection'}
                </Button>
              </div>
              {youtubeResult && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">YouTube Test Result:</h3>
                  <div className={`p-3 border rounded ${youtubeResult.data.isConnected ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                    <p className="font-medium">Status: {youtubeResult.status}</p>
                    <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-60 text-xs whitespace-pre-wrap break-words">
                      {JSON.stringify(youtubeResult.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="convex-test">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Test Convex database connection and operations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={testConvexConnection}
                    disabled={loading || !user}
                    className="w-full"
                    variant="outline"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    {loading ? 'Testing...' : 'Test Convex Connection'}
                  </Button>

                  <Button
                    onClick={testConvexUser}
                    disabled={loading || !user}
                    className="w-full"
                    variant="outline"
                  >
                    {loading ? 'Testing...' : 'Get Convex User'}
                  </Button>

                  <Button
                    onClick={createConvexUser}
                    disabled={loading || !user}
                    className="w-full"
                    variant="outline"
                  >
                    {loading ? 'Creating...' : 'Create/Update User'}
                  </Button>

                  <Button
                    onClick={getConvexGmailData}
                    disabled={loading || !user}
                    className="w-full"
                    variant="outline"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {loading ? 'Loading...' : 'Get Gmail Data'}
                  </Button>

                  <Button
                    onClick={getConvexYoutubeData}
                    disabled={loading || !user}
                    className="w-full"
                    variant="outline"
                  >
                    <Youtube className="w-4 h-4 mr-2" />
                    {loading ? 'Loading...' : 'Get YouTube Data'}
                  </Button>
                </div>
              </div>
              {convexResult && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Convex Test Result:</h3>
                  <div className={`p-3 border rounded ${convexResult.data.success ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                    <p className="font-medium">Status: {convexResult.status}</p>
                    <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-60 text-xs whitespace-pre-wrap break-words">
                      {JSON.stringify(convexResult.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {loading && (
            <div className="mt-4 text-blue-600">
              Loading...
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
              <h3 className="font-semibold text-red-700">Error:</h3>
              <p>{error}</p>
            </div>
          )}

          {testResult && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <div className={`p-3 border rounded ${
                testResult.status >= 200 && testResult.status < 300
                  ? 'bg-green-100 border-green-300'
                  : 'bg-red-100 border-red-300'
              }`}>
                <p className="font-medium">Status: {testResult.status}</p>
                <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-60 text-xs whitespace-pre-wrap break-words">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {envInfo && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Environment Info:</h3>
              <div className="p-3 border rounded bg-gray-100">
                <pre className="overflow-auto max-h-60 text-xs whitespace-pre-wrap break-words">
                  {JSON.stringify(envInfo, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
