// dashboard/src/components/POAPWidget.tsx - EMBEDDABLE WIDGET
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import axios from 'axios';

interface POAPWidgetProps {
  campaignId: string;
  apiUrl: string;
  theme?: 'light' | 'dark' | 'custom';
  customBranding?: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily?: string;
  };
  size?: 'small' | 'medium' | 'large';
  showEventInfo?: boolean;
  autoConnect?: boolean;
}

interface CampaignInfo {
  id: string;
  name: string;
  description: string;
  eventDate: string;
  location?: string;
  image: string;
  totalClaimed: number;
  maxSupply?: number;
  isClaimable: boolean;
  claimMethod: string;
  organizer: {
    name: string;
    company?: string;
    branding?: any;
  };
}

export const POAPWidget: React.FC<POAPWidgetProps> = ({
  campaignId,
  apiUrl,
  theme = 'light',
  customBranding,
  size = 'medium',
  showEventInfo = true,
  autoConnect = true
}) => {
  const { publicKey, connected } = useWallet();
  const [campaign, setCampaign] = useState<CampaignInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimData, setClaimData] = useState<any>(null);
  const [secretCode, setSecretCode] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load campaign info
  useEffect(() => {
    loadCampaignInfo();
  }, [campaignId]);

  const loadCampaignInfo = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/campaigns/${campaignId}/public`);
      if (response.data.success) {
        setCampaign(response.data.data);
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
      setError('Failed to load campaign information');
    }
  };

  const claimPOAP = async () => {
    if (!publicKey || !campaign) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${apiUrl}/api/poap/claim`, {
        userWallet: publicKey.toString(),
        campaignId,
        secretCode: campaign.claimMethod === 'code' ? secretCode : undefined,
        userEmail: campaign.claimMethod === 'email' ? userEmail : undefined,
        location: await getUserLocation(),
        referrer: window.location.href
      });

      if (response.data.success) {
        setClaimed(true);
        setClaimData(response.data.data);
        
        // Show success notification
        if (window.POAPWidget?.onSuccess) {
          window.POAPWidget.onSuccess(response.data.data);
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to claim POAP';
      setError(errorMessage);
      
      if (window.POAPWidget?.onError) {
        window.POAPWidget.onError(error.response?.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return {
        country: data.country_name,
        city: data.city,
        coordinates: [data.latitude, data.longitude]
      };
    } catch {
      return null;
    }
  };

  if (!campaign) {
    return (
      <div className={`poap-widget loading ${theme} ${size}`}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className={`poap-widget error ${theme} ${size}`}>
        <div className="error-message">❌ {error}</div>
      </div>
    );
  }

  const styles = getWidgetStyles(theme, customBranding || campaign.organizer.branding, size);

  return (
    <div className={`poap-widget ${theme} ${size}`} style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        {campaign.organizer.branding?.logo && (
          <img 
            src={campaign.organizer.branding.logo} 
            alt="Event Logo" 
            style={styles.logo}
          />
        )}
        <h3 style={styles.title}>🏅 Claim Your POAP Badge</h3>
      </div>

      {/* Event Info */}
      {showEventInfo && (
        <div style={styles.eventInfo}>
          <img src={campaign.image} alt={campaign.name} style={styles.eventImage} />
          <div style={styles.eventDetails}>
            <h4 style={styles.eventName}>{campaign.name}</h4>
            <p style={styles.eventDate}>
              📅 {new Date(campaign.eventDate).toLocaleDateString()}
            </p>
            {campaign.location && (
              <p style={styles.eventLocation}>📍 {campaign.location}</p>
            )}
            <div style={styles.claimStats}>
              {campaign.totalClaimed} claimed
              {campaign.maxSupply && ` of ${campaign.maxSupply}`}
            </div>
          </div>
        </div>
      )}

      {/* Claim Status */}
      {!campaign.isClaimable ? (
        <div style={styles.notClaimable}>
          <p>⏰ Claiming is not currently available</p>
        </div>
      ) : claimed ? (
        <div style={styles.success}>
          <h4>🎉 POAP Claimed Successfully!</h4>
          <p>Your badge #{claimData?.claimNumber} is being minted!</p>
          <p style={styles.successSubtext}>
            Check your wallet in {claimData?.estimatedArrivalTime || '1-2 minutes'}
          </p>
          {claimData?.nft?.explorerUrl && (
            <a 
              href={claimData.nft.explorerUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={styles.explorerLink}
            >
              🔗 View Transaction
            </a>
          )}
        </div>
      ) : (
        <div style={styles.claimSection}>
          {/* Wallet Connection */}
          {!connected ? (
            <div style={styles.connectSection}>
              <p style={styles.connectText}>Connect your wallet to claim your POAP</p>
              <WalletMultiButton style={styles.connectButton} />
            </div>
          ) : (
            <div style={styles.claimForm}>
              {/* Secret Code Input */}
              {campaign.claimMethod === 'code' && (
                <input
                  type="text"
                  placeholder="Enter event code"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  style={styles.input}
                />
              )}

              {/* Email Input */}
              {campaign.claimMethod === 'email' && (
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  style={styles.input}
                />
              )}

              {/* Error Message */}
              {error && (
                <div style={styles.error}>
                  ❌ {error}
                </div>
              )}

              {/* Claim Button */}
              <button
                onClick={claimPOAP}
                disabled={isLoading || !connected}
                style={{
                  ...styles.claimButton,
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? '🎨 Minting POAP...' : '🏅 Claim POAP Badge'}
              </button>

              <p style={styles.disclaimer}>
                ✨ Free minting • No gas fees • Powered by Solana
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.poweredBy}>
          Powered by <a href="https://poap-infra.com" target="_blank" style={styles.brandLink}>POAP Infrastructure</a>
        </p>
      </div>
    </div>
  );
};

// Widget Styles
const getWidgetStyles = (theme: string, branding: any, size: string) => {
  const baseColors = {
    light: {
      background: '#ffffff',
      text: '#1f2937',
      border: '#e5e7eb',
      primary: branding?.primaryColor || '#6366f1',
      secondary: branding?.secondaryColor || '#10b981'
    },
    dark: {
      background: '#1f2937',
      text: '#f9fafb',
      border: '#374151',
      primary: branding?.primaryColor || '#818cf8',
      secondary: branding?.secondaryColor || '#34d399'
    }
  };

  const colors = baseColors[theme as keyof typeof baseColors] || baseColors.light;

  const sizes = {
    small: { width: '300px', padding: '16px', fontSize: '14px' },
    medium: { width: '400px', padding: '24px', fontSize: '16px' },
    large: { width: '500px', padding: '32px', fontSize: '18px' }
  };

  const sizeConfig = sizes[size as keyof typeof sizes] || sizes.medium;

  return {
    container: {
      fontFamily: branding?.fontFamily || 'system-ui, sans-serif',
      backgroundColor: colors.background,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: sizeConfig.padding,
      width: sizeConfig.width,
      maxWidth: '100%',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      fontSize: sizeConfig.fontSize
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '16px'
    },
    logo: {
      height: '32px',
      marginBottom: '8px'
    },
    title: {
      margin: '0',
      fontSize: '1.25em',
      fontWeight: 'bold'
    },
    eventInfo: {
      display: 'flex',
      gap: '12px',
      marginBottom: '20px',
      padding: '12px',
      backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
      borderRadius: '8px'
    },
    eventImage: {
      width: '60px',
      height: '60px',
      borderRadius: '8px',
      objectFit: 'cover' as const
    },
    eventDetails: {
      flex: 1
    },
    eventName: {
      margin: '0 0 4px 0',
      fontSize: '1em',
      fontWeight: 'bold'
    },
    eventDate: {
      margin: '0 0 2px 0',
      fontSize: '0.875em',
      opacity: 0.8
    },
    eventLocation: {
      margin: '0 0 8px 0',
      fontSize: '0.875em',
      opacity: 0.8
    },
    claimStats: {
      fontSize: '0.75em',
      opacity: 0.7,
      fontWeight: 'bold'
    },
    connectSection: {
      textAlign: 'center' as const
    },
    connectText: {
      marginBottom: '16px',
      opacity: 0.8
    },
    connectButton: {
      backgroundColor: colors.primary,
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      color: 'white',
      fontWeight: 'bold',
      cursor: 'pointer'
    },
    claimForm: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px'
    },
    input: {
      padding: '12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      fontSize: '1em',
      backgroundColor: colors.background,
      color: colors.text
    },
    claimButton: {
      backgroundColor: colors.secondary,
      color: 'white',
      border: 'none',
      padding: '14px 24px',
      borderRadius: '8px',
      fontSize: '1em',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    success: {
      textAlign: 'center' as const,
      padding: '20px',
      backgroundColor: theme === 'dark' ? '#065f46' : '#d1fae5',
      borderRadius: '8px',
      color: theme === 'dark' ? '#a7f3d0' : '#065f46'
    },
    successSubtext: {
      fontSize: '0.875em',
      opacity: 0.8,
      margin: '8px 0'
    },
    explorerLink: {
      color: colors.primary,
      textDecoration: 'none',
      fontWeight: 'bold'
    },
    error: {
      padding: '8px 12px',
      backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fee2e2',
      color: theme === 'dark' ? '#fca5a5' : '#7f1d1d',
      borderRadius: '6px',
      fontSize: '0.875em'
    },
    disclaimer: {
      fontSize: '0.75em',
      textAlign: 'center' as const,
      opacity: 0.7,
      margin: '8px 0 0 0'
    },
    notClaimable: {
      textAlign: 'center' as const,
      padding: '20px',
      opacity: 0.7
    },
    footer: {
      marginTop: '16px',
      textAlign: 'center' as const,
      borderTop: `1px solid ${colors.border}`,
      paddingTop: '12px'
    },
    poweredBy: {
      fontSize: '0.75em',
      opacity: 0.6,
      margin: 0
    },
    brandLink: {
      color: colors.primary,
      textDecoration: 'none'
    }
  };
};

// Global widget interface for callbacks
declare global {
  interface Window {
    POAPWidget?: {
      onSuccess?: (data: any) => void;
      onError?: (error: any) => void;
    };
  }
}