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

  // Extract campaigns using the same logic as the main component
  const campaigns = campaignsData?.data?.campaigns || []

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
      <h3 className="font-bold text-blue-800">🔍 Debug: Campaigns API Response</h3>
      
      <div className="mt-2">
        <p><strong>📊 Summary:</strong></p>
        <ul className="text-sm ml-4 list-disc">
          <li>API Response Success: {campaignsData?.success ? '✅ Yes' : '❌ No'}</li>
          <li>Raw Data Exists: {campaignsData?.data ? '✅ Yes' : '❌ No'}</li>
          <li>Campaigns Array Exists: {campaignsData?.data?.campaigns ? '✅ Yes' : '❌ No'}</li>
          <li>Campaigns Count: <strong>{campaigns.length}</strong></li>
          <li>Is Array: {Array.isArray(campaigns) ? '✅ Yes' : '❌ No'}</li>
        </ul>
      </div>

      <div className="mt-2">
        <p><strong>🔍 Raw Response Structure:</strong></p>
        <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-32">
          {JSON.stringify(campaignsData, null, 2)}
        </pre>
      </div>

      <div className="mt-2">
        <p><strong>📋 Campaigns Array:</strong></p>
        <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-32">
          {JSON.stringify(campaigns, null, 2)}
        </pre>
      </div>

      {campaigns.length > 0 && (
        <div className="mt-2">
          <p><strong>🎯 First Campaign Sample:</strong></p>
          <pre className="text-xs bg-white p-2 rounded mt-1">
            {JSON.stringify(campaigns[0], null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-2">
        <p><strong>🧪 Test Rendering:</strong></p>
        <div className="bg-white p-2 rounded mt-1">
          {campaigns.length === 0 ? (
            <p className="text-red-600">❌ No campaigns to render</p>
          ) : (
            <div>
              <p className="text-green-600">✅ Found {campaigns.length} campaigns:</p>
              <ul className="ml-4 list-disc text-sm">
                {campaigns.map((campaign, index) => (
                  <li key={campaign.id || index}>
                    <strong>{campaign.name}</strong> 
                    {campaign.description && ` - ${campaign.description}`}
                    {campaign.isActive !== undefined && ` (${campaign.isActive ? 'Active' : 'Inactive'})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}