import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
import { useCreateCampaign } from '../../hooks/use-api'
import { Calendar, MapPin, Image, Key, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface CampaignCreatorProps {
  onClose: () => void
  onSuccess: () => void
}

export const CampaignCreator: React.FC<CampaignCreatorProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventDate: '',
    location: '',
    image: '',
    secretCode: '',
    maxSupply: '',
    requireCode: true,
  })

  

  const createCampaignMutation = useCreateCampaign()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.eventDate) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      // ✅ Fixed: Use correct data format matching the API
      await createCampaignMutation.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        eventDate: new Date(formData.eventDate).toISOString(), // ✅ Convert to ISO string
        location: formData.location || undefined,
        imageUrl: formData.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(formData.name)}`,
        secretCode: formData.requireCode ? formData.secretCode : undefined,
        maxClaims: formData.maxSupply ? parseInt(formData.maxSupply) : undefined,
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating campaign:', error)
      // Error handling is now done by the mutation hook
    }
  }

  const generateSecretCode = () => {
    const code = formData.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8) + '2024'
    setFormData(prev => ({ ...prev, secretCode: code }))
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎪 Create New POAP Campaign
          </DialogTitle>
          <DialogDescription>
            Set up a new Proof of Attendance Protocol campaign for your event
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                📝 Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Solana Breakpoint 2024"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your event..."
                    className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventDate" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Event Date *
                    </Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Singapore, Virtual"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visual & Branding */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Image className="w-4 h-4" />
                Visual & Branding
              </h3>
              
              <div>
                <Label htmlFor="image">Event Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://example.com/event-image.jpg"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty to auto-generate based on event name
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Access Control */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Access Control
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requireCode"
                    checked={formData.requireCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, requireCode: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="requireCode">Require secret code to claim</Label>
                </div>

                {formData.requireCode && (
                  <div>
                    <Label htmlFor="secretCode" className="flex items-center gap-2">
                      Secret Code
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateSecretCode}
                      >
                        Generate
                      </Button>
                    </Label>
                    <Input
                      id="secretCode"
                      value={formData.secretCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, secretCode: e.target.value.toUpperCase() }))}
                      placeholder="BREAKPOINT2024"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="maxSupply" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Max Supply (Optional)
                  </Label>
                  <Input
                    id="maxSupply"
                    type="number"
                    value={formData.maxSupply}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxSupply: e.target.value }))}
                    placeholder="e.g., 1000"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Leave empty for unlimited POAPs
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {formData.name && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">📱 Preview</h3>
                <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                      🏅
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{formData.name} - POAP</h4>
                      <p className="text-sm text-muted-foreground">
                        {formData.eventDate && new Date(formData.eventDate).toLocaleDateString()}
                        {formData.location && ` • ${formData.location}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Gasless minting on Solana • Zero fees for attendees
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createCampaignMutation.isPending}
              className="min-w-[120px]"
            >
              {createCampaignMutation.isPending ? (
                <>🎨 Creating...</>
              ) : (
                <>🚀 Create Campaign</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}