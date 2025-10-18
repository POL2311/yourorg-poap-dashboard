'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import axios from 'axios'

export function AnalyticsDebug() {
  const { isAuthenticated, token, organizer } = useAuth()
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAnalyticsAuth = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/analytics/test', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTestResult(response.data)
    } catch (error: any) {
      setTestResult({
        error: error.response?.data?.error || error.message,
        status: error.response?.status
      })
    } finally {
      setLoading(false)
    }
  }

  const testDailyClaims = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/analytics/claims/daily', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTestResult({
        success: true,
        data: response.data,
        message: 'Daily claims data retrieved successfully'
      })
    } catch (error: any) {
      setTestResult({
        error: error.response?.data?.error || error.message,
        status: error.response?.status
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔧 Analytics Debug</CardTitle>
        <CardDescription>
          Test analytics authentication and endpoints
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Auth Status</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>Authenticated:</span>
                <Badge variant={isAuthenticated ? "default" : "destructive"}>
                  {isAuthenticated ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>Token:</span>
                <Badge variant={token ? "default" : "destructive"}>
                  {token ? "Present" : "Missing"}
                </Badge>
              </div>
              {organizer && (
                <div className="text-sm text-gray-600">
                  Organizer: {organizer.name} ({organizer.email})
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Test Actions</h4>
            <div className="space-y-2">
              <Button 
                onClick={testAnalyticsAuth} 
                disabled={loading || !isAuthenticated}
                size="sm"
              >
                Test Auth
              </Button>
              <Button 
                onClick={testDailyClaims} 
                disabled={loading || !isAuthenticated}
                size="sm"
                variant="outline"
              >
                Test Daily Claims
              </Button>
            </div>
          </div>
        </div>

        {testResult && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Test Result</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
