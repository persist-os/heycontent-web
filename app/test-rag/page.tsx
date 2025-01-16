'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function TestRAG() {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [operation, setOperation] = useState<'add' | 'search'>('add')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const testRAG = async () => {
    if (!session) {
      setError('Please sign in first')
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/test-rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation,
          content,
          metadata: {
            type: operation === 'add' && content.includes('Subject:') ? 'email' : 'content',
            timestamp: new Date().toISOString(),
            analysis_type: content.toLowerCase().includes('partnership') ? 'partnership' : 'content',
            emailMetadata: content.includes('Subject:') ? {
              subject: content.split('Subject:')[1].split('\n')[0].trim(),
              from: content.includes('From:') ? content.split('From:')[1].split('\n')[0].trim() : undefined,
              to: ['team@avasetail.com'],
              date: new Date().toISOString(),
              isRead: false,
              labels: ['INBOX']
            } : undefined
          }
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

  if (!session) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <div className="text-center">
          Please sign in to test the RAG system
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test RAG System</h1>
      
      <div className="space-y-4">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setOperation('add')}
            className={`px-4 py-2 rounded ${
              operation === 'add' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Add Content
          </button>
          <button
            onClick={() => setOperation('search')}
            className={`px-4 py-2 rounded ${
              operation === 'search' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Search Content
          </button>
        </div>

        <textarea
          placeholder={operation === 'add' ? "Enter content to add..." : "Enter search query..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[100px] p-2 border rounded"
        />
        
        <button 
          onClick={testRAG} 
          disabled={loading || !content}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Processing...' : operation === 'add' ? 'Add Content' : 'Search Content'}
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