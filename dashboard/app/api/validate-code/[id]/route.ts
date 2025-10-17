import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { secretCode } = await request.json()
    
    if (!secretCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Secret code is required' 
      }, { status: 400 })
    }

    // Try to fetch campaign details to validate the secret code
    // First try the multitenant endpoint, then fall back to checking if campaign exists
    let campaignData = null
    
    try {
      const campaignResponse = await fetch(`${API_URL}/api/campaigns/${params.id}/public`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': request.headers.get('user-agent') || 'Code-Validation-Proxy',
        },
      })

      if (campaignResponse.ok) {
        const response = await campaignResponse.json()
        if (response.success && response.data) {
          campaignData = response.data
        }
      }
    } catch (error) {
      console.log('Public campaign endpoint not available, trying alternative approach')
    }

    // If we couldn't get campaign data from the public endpoint,
    // we'll need to validate differently or return a generic response
    if (!campaignData) {
      // For now, we'll assume the code validation should be done on the claim endpoint
      // This is a fallback for when the backend doesn't have the public campaign endpoint
      return NextResponse.json({ 
        success: true, 
        data: { 
          isValid: true, // We can't validate without campaign data, so we'll let the claim endpoint handle it
          message: 'Code will be validated during claim process'
        } 
      })
    }

    // Validate the secret code against the campaign data
    const isValidCode = !campaignData.secretCode || campaignData.secretCode === secretCode
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        isValid: isValidCode,
        message: isValidCode ? 'Code is valid' : 'Invalid secret code',
        requiresCode: !!campaignData.secretCode
      } 
    })

  } catch (error) {
    console.error('Code validation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}