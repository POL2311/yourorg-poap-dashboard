import { NextRequest, NextResponse } from 'next/server'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userPublicKey, secretCode } = await request.json()
    if (!userPublicKey) {
      return NextResponse.json({ success:false, error:'User public key is required' }, { status:400 })
    }

    const resp = await fetch(`${API_URL}/api/poap/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'POAP-Claim-Proxy',
        'X-Forwarded-For': request.ip || 'unknown',
      },
      body: JSON.stringify({
        userPublicKey,
        campaignId: params.id,
        secretCode: secretCode ?? undefined,
      }),
    })

    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch (e) {
    console.error('Claim proxy error:', e)
    return NextResponse.json({ success:false, error:'Internal server error' }, { status:500 })
  }
}
