// Test component to check authentication and API
'use client'

import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'

export function DebugAuth() {
  const { organizer, isAuthenticated, token } = useAuth()
  const [apiTest, setApiTest] = useState<any>(null)

  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/campaigns', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
            'Content-Type': 'application/json'
          }
        })
        const data = await response.json()
        setApiTest({ status: response.status, data })
      } catch (error) {
        setApiTest({ error: error.message })
      }
    }

    if (isAuthenticated) {
      testAPI()
    }
  }, [isAuthenticated])

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
      <h3 className="font-bold text-yellow-800">🔐 Debug: Authentication & API</h3>
      
      <div className="mt-2 space-y-2">
        <div>
          <strong>Is Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          <strong>Has Token:</strong> {token ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          <strong>Organizer ID:</strong> {organizer?.id || 'None'}
        </div>
        <div>
          <strong>Organizer Email:</strong> {organizer?.email || 'None'}
        </div>
        <div>
          <strong>Organizer Tier:</strong> {organizer?.tier || 'None'}
        </div>
      </div>

      {apiTest && (
        <div className="mt-4">
          <strong>🌐 Direct API Test:</strong>
          <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-32">
            {JSON.stringify(apiTest, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4">
        <strong>🔑 Token (first 20 chars):</strong>
        <code className="text-xs bg-white p-1 rounded ml-2">
          {token ? token.substring(0, 20) + '...' : 'No token'}
        </code>
      </div>
    </div>
  )
}