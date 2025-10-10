// MODULE 1: Enhanced POAP Demo Frontend
// examples/poap-demo/src/POAPDemoApp.tsx

import React, { useState, useCallback, useMemo } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'

import '@solana/wallet-adapter-react-ui/styles.css'

// Demo Event Configuration
const DEMO_EVENT = {
  id: 'solana-breakpoint-2024',
  name: 'Solana Breakpoint 2024',
  description: 'The premier Solana conference bringing together builders, creators, and innovators from around the world.',
  date: '2024-09-20',
  location: 'Singapore',
  image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
  organizer: {
    name: 'Solana Foundation',
    logo: 'https://solana.com/src/img/branding/solanaLogoMark.svg',
    website: 'https://solana.com'
  },
  stats: {
    expectedAttendees: 5000,
    currentClaims: 1247,
    maxSupply: 5000
  },
  claimMethod: 'code',
  secretCode: 'BREAKPOINT2024'
};

const endpoint = 'https://api.devnet.solana.com'
const apiUrl = 'http://localhost:3000'

// ✅ HELPER: Record mint for dashboard analytics
function recordMintForDashboard(data: {
  campaignName: string
  userWallet: string
  transactionSignature: string
  mintAddress: string
}) {
  try {
    const mintRecord = {
      id: `mint_${Date.now()}`,
      ...data,
      timestamp: new Date().toISOString(),
    }
    
    const existing = JSON.parse(localStorage.getItem('poap-mint-records') || '[]')
    existing.push(mintRecord)
    localStorage.setItem('poap-mint-records', JSON.stringify(existing))
    
    // Update campaign claim count
    const campaigns = JSON.parse(localStorage.getItem('poap-campaigns') || '[]')
    const campaign = campaigns.find((c: any) => c.name === data.campaignName)
    if (campaign) {
      campaign.totalClaimed += 1
      campaign.updatedAt = new Date().toISOString()
      localStorage.setItem('poap-campaigns', JSON.stringify(campaigns))
    }
    
    console.log('📊 Recorded POAP mint for dashboard analytics:', mintRecord)
  } catch (error) {
    console.warn('Failed to record POAP mint for dashboard:', error)
  }
}

export default function POAPDemoApp() {
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="poap-demo-app">
            {/* Hero Section */}
            <HeroSection />
            
            {/* Event Info */}
            <EventInfoSection event={DEMO_EVENT} />
            
            {/* POAP Claiming Section */}
            <POAPClaimingSection event={DEMO_EVENT} />
            
            {/* Features Section */}
            <FeaturesSection />
            
            {/* Footer */}
            <FooterSection />
          </div>

          <Toaster 
            position="top-right" 
            toastOptions={{ 
              duration: 10000,
              style: {
                background: '#1f2937',
                color: '#fff',
                borderRadius: 10,
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                maxWidth: '500px'
              }
            }} 
          />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

const HeroSection = () => (
  <section className="hero">
    <div className="hero-content">
      <h1>🏅 Gasless infrastructure</h1>
      <p className="hero-subtitle">
        Gasless Proof of Attendance Protocol for Solana
      </p>
      <p className="hero-description">
        Enable your event attendees to claim NFT badges without paying gas fees. 
        Built on Solana for instant, cost-effective distribution.
      </p>
      <div className="hero-stats">
        <div className="stat">
          <span className="stat-number">$0</span>
          <span className="stat-label">Gas Fees</span>
        </div>
        <div className="stat">
          <span className="stat-number">~2s</span>
          <span className="stat-label">Mint Time</span>
        </div>
        <div className="stat">
          <span className="stat-number">100%</span>
          <span className="stat-label">Success Rate</span>
        </div>
      </div>
    </div>
  </section>
);

const EventInfoSection = ({ event }: { event: typeof DEMO_EVENT }) => (
  <section className="event-info">
    <div className="container">
      <div className="event-card">
        <div className="event-header">
          <img src={event.organizer.logo} alt="Organizer" className="organizer-logo" />
          <div className="event-details">
            <h2>{event.name}</h2>
            <p className="event-meta">
              📅 {new Date(event.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="event-meta">📍 {event.location}</p>
            <p className="event-meta">🏢 {event.organizer.name}</p>
          </div>
        </div>
        
        <div className="event-image">
          <img src={event.image} alt={event.name} />
        </div>
        
        <div className="event-description">
          <p>{event.description}</p>
        </div>
        
        <div className="event-stats">
          <div className="stat-item">
            <span className="stat-value">{event.stats.currentClaims.toLocaleString()}</span>
            <span className="stat-label">POAPs Claimed</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{event.stats.expectedAttendees.toLocaleString()}</span>
            <span className="stat-label">Expected Attendees</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{((event.stats.currentClaims / event.stats.maxSupply) * 100).toFixed(1)}%</span>
            <span className="stat-label">Claim Rate</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const POAPClaimingSection = ({ event }: { event: typeof DEMO_EVENT }) => {
  const { publicKey } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [claimData, setClaimData] = useState<any>(null)
  const [secretCode, setSecretCode] = useState('')
  const [showHint, setShowHint] = useState(false)

  const claimPOAP = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet first!')
      return
    }

    if (!secretCode) {
      toast.error('Please enter the event code')
      return
    }

    setIsLoading(true)
    const loadingToast = toast.loading('🎨 Minting your POAP badge...')

    try {
      console.log('🏅 DEMO POAP CLAIM STARTED')
      console.log(`👤 User: ${publicKey.toString()}`)
      console.log(`🎪 Event: ${event.name}`)
      console.log(`🔑 Code: ${secretCode}`)

      const response = await axios.post(`${apiUrl}/api/nft/claim-magical`, {
        userPublicKey: publicKey.toString(),
        serviceId: 'poap-demo',
        eventId: event.id,
        eventName: event.name,
        secretCode: secretCode,
        metadata: {
          eventName: event.name,
          eventDate: event.date,
          location: event.location,
          organizer: event.organizer.name
        }
      })

      if (response.data.success) {
        const { nft, transactionSignature, gasCostPaidByRelayer } = response.data.data
        
        // ✅ Record this POAP mint for dashboard analytics
        recordMintForDashboard({
          campaignName: event.name,
          userWallet: publicKey.toString(),
          transactionSignature: nft.transactionSignature || transactionSignature,
          mintAddress: nft.mint,
        })
        
        toast.dismiss(loadingToast)
        setClaimed(true)
        setClaimData(response.data.data)
        
        toast.success(
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 16 }}>
              🎉 POAP Badge Claimed!
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              ✨ {event.name} attendance verified • Gas paid by infrastructure
            </div>
          </div>,
          { duration: 12000 }
        )

        setTimeout(() => {
          toast.success(
            <div style={{ fontSize: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>🏅 {event.name} POAP</div>
              <div>📍 Mint: {nft.mint.slice(0, 12)}...{nft.mint.slice(-12)}</div>
              <div>📦 TX: {nft.transactionSignature.slice(0, 12)}...{nft.transactionSignature.slice(-12)}</div>
              <div>🔗 <a href={`https://explorer.solana.com/tx/${nft.transactionSignature}?cluster=devnet`} target="_blank" style={{color: '#4ade80'}}>View on Explorer</a></div>
            </div>,
            { duration: 20000 }
          )
        }, 2000)

      } else {
        throw new Error(response.data.error || 'Failed to claim POAP')
      }

    } catch (error: any) {
      console.error('❌ Error claiming POAP:', error)
      toast.dismiss(loadingToast)
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to claim POAP'
      toast.error(`❌ ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }, [publicKey, secretCode, event])

  return (
    <section className="poap-claiming">
      <div className="container">
        <div className="claiming-card">
          <h2>🏅 Claim Your POAP Badge</h2>
          <p>Get your proof of attendance NFT for {event.name}</p>
          
          {!claimed ? (
            <div className="claim-form">
              <div className="wallet-section">
                <label>1. Connect Your Wallet</label>
                <WalletMultiButton className="wallet-button" />
              </div>
              
              <div className="code-section">
                <label>2. Enter Event Code</label>
                <div className="code-input-group">
                  <input
                    type="text"
                    placeholder="Enter the secret code from the event"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                    className="code-input"
                    disabled={isLoading}
                  />
                  
                  <button 
                    type="button" 
                    className="hint-button"
                    onClick={() => setShowHint(!showHint)}
                  >
                    💡
                  </button>
                </div>
                {showHint && (
                  <div className="hint">
                    💡 Demo hint: The code is <code>BREAKPOINT2024</code>
                  </div>
                )}
              </div>
              
              <div className="claim-section">
                <label>3. Claim Your POAP</label>
                <button
                  onClick={claimPOAP}
                  disabled={isLoading || !publicKey || !secretCode}
                  className="claim-button"
                >
                  {isLoading 
                    ? '🎨 Minting POAP...' 
                    : '🏅 Claim POAP Badge (FREE)'}
                </button>
                <p className="claim-note">
                  ✨ No gas fees • Instant delivery • Powered by Solana
                </p>
              </div>
            </div>
          ) : (
            <div className="success-state">
              <div className="success-icon">🎉</div>
              <h3>POAP Badge Claimed Successfully!</h3>
              <p>Your {event.name} attendance badge is now in your wallet!</p>
              
              <div className="claim-details">
                <div className="detail-item">
                  <span className="label">Event:</span>
                  <span className="value">{event.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Date:</span>
                  <span className="value">{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Location:</span>
                  <span className="value">{event.location}</span>
                </div>
                {claimData?.explorerUrl && (
                  <a 
                    href={claimData.explorerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="explorer-link"
                  >
                    🔗 View Transaction on Solana Explorer
                  </a>
                )}
              </div>
              
              <div className="next-steps">
                <h4>📱 Next Steps:</h4>
                <ol>
                  <li>Open your Solana wallet (Phantom, Solflare)</li>
                  <li>Go to the NFTs/Collectibles section</li>
                  <li>Your POAP badge will appear within 1-2 minutes</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

const FeaturesSection = () => (
  <section className="features">
    <div className="container">
      <h2>Why Choose Gasless infrastructure?</h2>
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">💰</div>
          <h3>Zero Gas Fees</h3>
          <p>Attendees claim POAPs without paying any transaction fees. Our infrastructure covers all costs.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Instant Delivery</h3>
          <p>POAPs are minted and delivered to wallets in seconds, not minutes or hours.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔧</div>
          <h3>Easy Integration</h3>
          <p>Embed our widget on any website or use our API for custom implementations.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Real-time Analytics</h3>
          <p>Track claims, engagement, and attendee insights with our comprehensive dashboard.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎨</div>
          <h3>Custom Branding</h3>
          <p>Fully customize the look and feel to match your event's brand and style.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Secure & Reliable</h3>
          <p>Built on Solana with enterprise-grade security and 99.9% uptime guarantee.</p>
        </div>
      </div>
    </div>
  </section>
);

const FooterSection = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-content">
        <div className="footer-section">
          <h3>🏅 Gasless infrastructure</h3>
          <p>Gasless Proof of Attendance Protocol for Solana</p>
        </div>
        <div className="footer-section">
          <h4>Product</h4>
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#docs">Documentation</a></li>
            <li><a href="#api">API</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Company</h4>
          <ul>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><a href="#careers">Careers</a></li>
            <li><a href="#blog">Blog</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Connect</h4>
          <ul>
            <li><a href="#twitter">Twitter</a></li>
            <li><a href="#discord">Discord</a></li>
            <li><a href="#github">GitHub</a></li>
            <li><a href="#linkedin">LinkedIn</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 Gasless infrastructure. Built with ❤️ on Solana.</p>
      </div>
    </div>
  </footer>
);