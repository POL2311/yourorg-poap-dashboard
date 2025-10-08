import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { userPublicKey, secretCode } = body

    if (!userPublicKey) {
      return NextResponse.json(
        { success: false, error: 'User public key is required' },
        { status: 400 }
      )
    }

    // Get the API key from environment (server-side only)
    const apiKey = process.env.POAP_API_KEY
    if (!apiKey) {
      console.error('POAP_API_KEY not configured')
      return NextResponse.json(
        { success: false, error: 'Service temporarily unavailable' },
        { status: 500 }
      )
    }

    // Proxy the request to the backend API
    const response = await fetch(`${API_URL}/api/poap/claim`, {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'POAP-Claim-Proxy',
        'X-Forwarded-For': request.ip || 'unknown',
      },
      body: JSON.stringify({
        userPublicKey,
        campaignId: params.id,
        secretCode,
      }),
    })

    const data = await response.json()

    // Return the response with appropriate status
    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error('Claim proxy error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}