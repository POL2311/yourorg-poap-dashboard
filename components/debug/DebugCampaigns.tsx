// Debug component to help troubleshoot the API response
'use client'

import { useCampaigns } from '@/hooks/use-api'

export function DebugCampaigns() {
  const { data: campaignsData, isLoading, error } = useCampaigns({
    limit: 50,
  })

  if (isLoading) return <div>Loading campaigns...</div>

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="font-bold text-red-800">Error loading campaigns:</h3>
        <pre className="text-sm text-red-600 mt-2">{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
      <h3 className="font-bold text-blue-800">Debug: Campaigns API Response</h3>
      <div className="mt-2">
        <p><strong>Raw response:</strong></p>
        <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-96">
          {JSON.stringify(campaignsData, null, 2)}
        </pre>
      </div>
      <div className="mt-2">
        <p><strong>Campaigns array:</strong></p>
        <pre className="text-xs bg-white p-2 rounded mt-1">
          {JSON.stringify(campaignsData?.data?.campaigns, null, 2)}
        </pre>
      </div>
      <div className="mt-2">
        <p><strong>Campaigns count:</strong> {campaignsData?.data?.campaigns?.length || 0}</p>
      </div>
    </div>
  )
}