// dashboard/src/pages/Dashboard.tsx - UPDATED ORGANIZER DASHBOARD
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCampaigns, useAnalytics } from '../../hooks/useApi';
import { CampaignCreator } from '../../components/forms/CampaignCreator';
import { AnalyticsChart } from '../../components/analytics/AnalyticsChart';
import { WidgetGenerator } from '../../components/widgets/WidgetGenerator';
import { SubscriptionStatus } from '../../components/subscription/SubscriptionStatus';

export const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { data: campaigns = [], refetch: refetchCampaigns } = useCampaigns();
  const { data: analytics } = useAnalytics();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="organizer-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🎪 POAP Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
        </div>
        <SubscriptionStatus user={user} />
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'campaigns' ? 'active' : ''}
          onClick={() => setActiveTab('campaigns')}
        >
          🎪 Campaigns
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        <button 
          className={activeTab === 'widgets' ? 'active' : ''}
          onClick={() => setActiveTab('widgets')}
        >
          🔧 Widgets
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>

      {/* Content */}
      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab user={user} campaigns={campaigns} analytics={analytics} />
        )}
        
        {activeTab === 'campaigns' && (
          <CampaignsTab campaigns={campaigns} onCampaignUpdate={refetchCampaigns} />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsTab analytics={analytics} />
        )}
        
        {activeTab === 'widgets' && (
          <WidgetsTab campaigns={campaigns} user={user} />
        )}
        
        {activeTab === 'settings' && (
          <SettingsTab user={user} />
        )}
      </main>
    </div>
  );
};

// Overview Tab
const OverviewTab: React.FC<{ user: any; campaigns: any[]; analytics: any }> = ({ 
  user, campaigns, analytics 
}) => (
  <div className="overview-tab">
    {/* Quick Stats */}
    <div className="stats-grid">
      <div className="stat-card">
        <h3>Total Campaigns</h3>
        <p className="stat-number">{campaigns.length}</p>
      </div>
      <div className="stat-card">
        <h3>Total POAPs Claimed</h3>
        <p className="stat-number">{analytics?.totalClaims || 0}</p>
      </div>
      <div className="stat-card">
        <h3>This Month</h3>
        <p className="stat-number">{user?.usedPOAPsThisMonth || 0}</p>
        <p className="stat-limit">of {user?.monthlyPOAPLimit || 0}</p>
      </div>
      <div className="stat-card">
        <h3>Success Rate</h3>
        <p className="stat-number">{analytics?.successRate || 0}%</p>
      </div>
    </div>

    {/* Recent Activity */}
    <div className="recent-activity">
      <h2>📈 Recent Activity</h2>
      <div className="activity-list">
        {analytics?.recentClaims?.map((claim: any) => (
          <div key={claim.id} className="activity-item">
            <div className="activity-icon">🏅</div>
            <div className="activity-details">
              <p><strong>{claim.campaignName}</strong></p>
              <p>Claimed by {claim.userWallet.slice(0, 8)}...</p>
              <p className="activity-time">{new Date(claim.claimedAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Quick Actions */}
    <div className="quick-actions">
      <h2>🚀 Quick Actions</h2>
      <div className="action-buttons">
        <button className="action-btn primary">
          ➕ Create New Campaign
        </button>
        <button className="action-btn secondary">
          📊 View Analytics
        </button>
        <button className="action-btn secondary">
          🔧 Generate Widget
        </button>
      </div>
    </div>
  </div>
);

// Campaigns Tab
const CampaignsTab: React.FC<{ campaigns: any[]; onCampaignUpdate: () => void }> = ({ 
  campaigns, onCampaignUpdate 
}) => {
  const [showCreator, setShowCreator] = useState(false);

  return (
    <div className="campaigns-tab">
      <div className="campaigns-header">
        <h2>🎪 Your POAP Campaigns</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowCreator(true)}
        >
          ➕ Create New Campaign
        </button>
      </div>

      {showCreator && (
        <CampaignCreator 
          onClose={() => setShowCreator(false)}
          onSuccess={onCampaignUpdate}
        />
      )}

      <div className="campaigns-grid">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </div>
  );
};

// Campaign Card Component
const CampaignCard: React.FC<{ campaign: any }> = ({ campaign }) => {
  const claimRate = campaign.maxSupply 
    ? (campaign.totalClaimed / campaign.maxSupply * 100).toFixed(1)
    : 'Unlimited';

  return (
    <div className="campaign-card">
      <div className="campaign-image">
        <img src={campaign.image} alt={campaign.name} />
        <div className="campaign-status">
          {campaign.isActive ? '🟢 Active' : '🔴 Inactive'}
        </div>
      </div>
      
      <div className="campaign-content">
        <h3>{campaign.name}</h3>
        <p className="campaign-date">
          📅 {new Date(campaign.eventDate).toLocaleDateString()}
        </p>
        <p className="campaign-location">📍 {campaign.location || 'Virtual'}</p>
        
        <div className="campaign-stats">
          <div className="stat">
            <span className="stat-label">Claimed:</span>
            <span className="stat-value">{campaign.totalClaimed}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Rate:</span>
            <span className="stat-value">{claimRate}%</span>
          </div>
        </div>

        <div className="campaign-actions">
          <button className="btn-secondary">📊 Analytics</button>
          <button className="btn-secondary">🔧 Widget</button>
          <button className="btn-secondary">⚙️ Edit</button>
        </div>
      </div>
    </div>
  );
};

// Analytics Tab
const AnalyticsTab: React.FC<{ analytics: any }> = ({ analytics }) => (
  <div className="analytics-tab">
    <h2>📈 Campaign Analytics</h2>
    
    <div className="analytics-filters">
      <select>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
      </select>
      <select>
        <option value="all">All Campaigns</option>
        {/* Campaign options */}
      </select>
    </div>

    <AnalyticsChart data={analytics?.chartData} />
    
    <div className="analytics-insights">
      <h3>💡 Insights</h3>
      <ul>
        <li>Peak claiming time: {analytics?.peakTime}</li>
        <li>Most popular location: {analytics?.topLocation}</li>
        <li>Average claim time: {analytics?.avgClaimTime}</li>
      </ul>
    </div>
  </div>
);

// Widgets Tab
const WidgetsTab: React.FC<{ campaigns: any[]; user: any }> = ({ campaigns, user }) => (
  <div className="widgets-tab">
    <h2>🔧 Widget Generator</h2>
    <p>Generate embeddable widgets for your campaigns</p>
    
    <WidgetGenerator campaigns={campaigns} branding={user?.customBranding} />
  </div>
);

// Settings Tab
const SettingsTab: React.FC<{ user: any }> = ({ user }) => (
  <div className="settings-tab">
    <h2>⚙️ Account Settings</h2>
    
    <div className="settings-sections">
      <section className="settings-section">
        <h3>Profile Information</h3>
        <form>
          <input type="text" placeholder="Organization Name" defaultValue={user?.name} />
          <input type="email" placeholder="Email" defaultValue={user?.email} />
          <input type="text" placeholder="Company" defaultValue={user?.company} />
          <button type="submit">Save Changes</button>
        </form>
      </section>

      <section className="settings-section">
        <h3>Custom Branding</h3>
        <form>
          <input type="url" placeholder="Logo URL" />
          <input type="color" placeholder="Primary Color" />
          <input type="color" placeholder="Secondary Color" />
          <input type="text" placeholder="Custom Domain" />
          <button type="submit">Update Branding</button>
        </form>
      </section>

      <section className="settings-section">
        <h3>API Configuration</h3>
        <div className="api-key">
          <label>API Key:</label>
          <code>{user?.apiKey}</code>
          <button>Regenerate</button>
        </div>
      </section>
    </div>
  </div>
);