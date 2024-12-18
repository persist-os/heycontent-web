'use client'

import { useState } from 'react'

export default function TestRAG() {
  const [content, setContent] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const testRAG = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/test-rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Something went wrong')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test RAG System</h1>
      
      <div className="space-y-4">
        <textarea
          placeholder="Enter some text to test..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[100px] p-2 border rounded"
        />
        
        <button 
          onClick={testRAG} 
          disabled={loading || !content}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test RAG'}
        </button>

        {error && (
          <div className="text-red-500 mt-4">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Results:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 