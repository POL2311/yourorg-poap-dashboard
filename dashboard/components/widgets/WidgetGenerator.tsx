import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { Copy, Code, Palette, Settings, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface Campaign {
  id: string
  name: string
  claimUrl: string
}

interface WidgetGeneratorProps {
  campaigns: Campaign[]
  branding?: {
    logo?: string
    primaryColor?: string
    secondaryColor?: string
  }
}

export const WidgetGenerator: React.FC<WidgetGeneratorProps> = ({ campaigns, branding }) => {
  const [selectedCampaign, setSelectedCampaign] = useState<string>(campaigns[0]?.id || '')
  const [widgetConfig, setWidgetConfig] = useState({
    width: '400',
    height: '600',
    theme: 'light',
    showBranding: true,
    customColors: {
      primary: branding?.primaryColor || '#6366f1',
      secondary: branding?.secondaryColor || '#8b5cf6',
      background: '#ffffff',
      text: '#1f2937',
    },
    borderRadius: '12',
    showStats: true,
    showDescription: true,
  })

  const selectedCampaignData = campaigns.find(c => c.id === selectedCampaign)

  const generateEmbedCode = () => {
    const baseUrl = selectedCampaignData?.claimUrl || 'http://localhost:5173'
    const params = new URLSearchParams({
      campaign: selectedCampaign,
      theme: widgetConfig.theme,
      width: widgetConfig.width,
      height: widgetConfig.height,
      primary: widgetConfig.customColors.primary.replace('#', ''),
      secondary: widgetConfig.customColors.secondary.replace('#', ''),
      radius: widgetConfig.borderRadius,
      branding: widgetConfig.showBranding.toString(),
      stats: widgetConfig.showStats.toString(),
      description: widgetConfig.showDescription.toString(),
    })

    return `<iframe 
  src="${baseUrl}?${params.toString()}"
  width="${widgetConfig.width}"
  height="${widgetConfig.height}"
  frameborder="0"
  style="border-radius: ${widgetConfig.borderRadius}px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
  title="POAP Claim Widget - ${selectedCampaignData?.name || 'Campaign'}"
></iframe>`
  }

  const generateReactCode = () => {
    return `import React from 'react'

const POAPWidget = () => {
  return (
    <iframe
      src="${selectedCampaignData?.claimUrl || 'http://localhost:5173'}?campaign=${selectedCampaign}&theme=${widgetConfig.theme}"
      width="${widgetConfig.width}"
      height="${widgetConfig.height}"
      frameBorder="0"
      style={{
        borderRadius: '${widgetConfig.borderRadius}px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
      title="POAP Claim Widget"
    />
  )
}

export default POAPWidget`
  }

  const generateWordPressCode = () => {
    return `[poap_widget 
  campaign="${selectedCampaign}" 
  width="${widgetConfig.width}" 
  height="${widgetConfig.height}" 
  theme="${widgetConfig.theme}"
  primary_color="${widgetConfig.customColors.primary}"
  secondary_color="${widgetConfig.customColors.secondary}"
]`
  }

  const copyToClipboard = (code: string, type: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`${type} code copied to clipboard!`)
  }

  const previewUrl = `${selectedCampaignData?.claimUrl || 'http://localhost:5173'}?campaign=${selectedCampaign}&theme=${widgetConfig.theme}&preview=true`

  return (
    <div className="space-y-6">
      {/* Campaign Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Widget Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="campaign">Select Campaign</Label>
            <select
              id="campaign"
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-input rounded-md"
            >
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                value={widgetConfig.width}
                onChange={(e) => setWidgetConfig(prev => ({ ...prev, width: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                value={widgetConfig.height}
                onChange={(e) => setWidgetConfig(prev => ({ ...prev, height: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="theme">Theme</Label>
            <select
              id="theme"
              value={widgetConfig.theme}
              onChange={(e) => setWidgetConfig(prev => ({ ...prev, theme: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-input rounded-md"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primary">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary"
                  type="color"
                  value={widgetConfig.customColors.primary}
                  onChange={(e) => setWidgetConfig(prev => ({
                    ...prev,
                    customColors: { ...prev.customColors, primary: e.target.value }
                  }))}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={widgetConfig.customColors.primary}
                  onChange={(e) => setWidgetConfig(prev => ({
                    ...prev,
                    customColors: { ...prev.customColors, primary: e.target.value }
                  }))}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="secondary">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary"
                  type="color"
                  value={widgetConfig.customColors.secondary}
                  onChange={(e) => setWidgetConfig(prev => ({
                    ...prev,
                    customColors: { ...prev.customColors, secondary: e.target.value }
                  }))}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={widgetConfig.customColors.secondary}
                  onChange={(e) => setWidgetConfig(prev => ({
                    ...prev,
                    customColors: { ...prev.customColors, secondary: e.target.value }
                  }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="borderRadius">Border Radius (px)</Label>
            <Input
              id="borderRadius"
              value={widgetConfig.borderRadius}
              onChange={(e) => setWidgetConfig(prev => ({ ...prev, borderRadius: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showBranding"
                checked={widgetConfig.showBranding}
                onChange={(e) => setWidgetConfig(prev => ({ ...prev, showBranding: e.target.checked }))}
              />
              <Label htmlFor="showBranding">Show branding</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showStats"
                checked={widgetConfig.showStats}
                onChange={(e) => setWidgetConfig(prev => ({ ...prev, showStats: e.target.checked }))}
              />
              <Label htmlFor="showStats">Show statistics</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showDescription"
                checked={widgetConfig.showDescription}
                onChange={(e) => setWidgetConfig(prev => ({ ...prev, showDescription: e.target.checked }))}
              />
              <Label htmlFor="showDescription">Show description</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              👁️ Live Preview
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div 
              className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
              style={{ 
                width: `${Math.min(parseInt(widgetConfig.width), 400)}px`,
                height: `${Math.min(parseInt(widgetConfig.height), 300)}px`,
                borderRadius: `${widgetConfig.borderRadius}px`
              }}
            >
              <div 
                className="h-full flex flex-col items-center justify-center p-6 text-center"
                style={{ 
                  background: `linear-gradient(135deg, ${widgetConfig.customColors.primary}, ${widgetConfig.customColors.secondary})`
                }}
              >
                <div className="text-white">
                  <div className="text-4xl mb-4">🏅</div>
                  <h3 className="font-bold text-lg mb-2">{selectedCampaignData?.name || 'Campaign Name'}</h3>
                  <p className="text-sm opacity-90 mb-4">Claim your POAP badge</p>
                  <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2 text-sm">
                    Widget Preview
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Generated Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="html" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="react">React</TabsTrigger>
              <TabsTrigger value="wordpress">WordPress</TabsTrigger>
              <TabsTrigger value="url">Direct URL</TabsTrigger>
            </TabsList>

            <TabsContent value="html" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">HTML Embed Code</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateEmbedCode(), 'HTML')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                <code>{generateEmbedCode()}</code>
              </pre>
            </TabsContent>

            <TabsContent value="react" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">React Component</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateReactCode(), 'React')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                <code>{generateReactCode()}</code>
              </pre>
            </TabsContent>

            <TabsContent value="wordpress" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">WordPress Shortcode</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateWordPressCode(), 'WordPress')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                <code>{generateWordPressCode()}</code>
              </pre>
              <div className="text-sm text-muted-foreground">
                <p>📝 Note: Requires POAP Infrastructure WordPress plugin</p>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Direct URL</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(previewUrl, 'URL')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <code className="text-sm break-all">{previewUrl}</code>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>🔗 Use this URL to link directly to the claim page</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Integration Tips */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Integration Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">📱 Mobile Optimization</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use responsive width (e.g., 100%)</li>
                <li>• Minimum height: 500px</li>
                <li>• Test on different screen sizes</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🎨 Design Best Practices</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Match your brand colors</li>
                <li>• Use consistent border radius</li>
                <li>• Consider dark mode support</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">⚡ Performance</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Widget loads asynchronously</li>
                <li>• No impact on page speed</li>
                <li>• Cached for fast loading</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🔒 Security</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Sandboxed iframe</li>
                <li>• HTTPS only</li>
                <li>• No data collection</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}