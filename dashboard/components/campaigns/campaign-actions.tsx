'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  MoreHorizontal, 
  ExternalLink, 
  Copy, 
  QrCode, 
  Edit, 
  Trash2,
  Eye
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import QRCode from 'qrcode'
import Link from 'next/link'

interface CampaignActionsProps {
  campaignId: string
  campaignName: string
  onEdit?: () => void
  onDelete?: () => void
  showViewDetails?: boolean
}

export function CampaignActions({ 
  campaignId, 
  campaignName, 
  onEdit, 
  onDelete,
  showViewDetails = true 
}: CampaignActionsProps) {
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  const claimUrl = `${window.location.origin}/claim/${campaignId}`

  const copyClaimUrl = () => {
    navigator.clipboard.writeText(claimUrl)
    toast.success('Claim URL copied to clipboard!')
  }

  const openClaimPage = () => {
    window.open(claimUrl, '_blank')
  }

  const generateQRCode = async () => {
    try {
      const qrDataUrl = await QRCode.toDataURL(claimUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(qrDataUrl)
      setQrDialogOpen(true)
    } catch (error) {
      toast.error('Failed to generate QR code')
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl) return

    const link = document.createElement('a')
    link.download = `${campaignName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.png`
    link.href = qrCodeUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('QR code downloaded!')
  }

  return (
    <>
      <div className="flex items-center space-x-2">
        {/* Primary Actions */}
        <Button variant="outline" size="sm" onClick={openClaimPage}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Claim Page
        </Button>
        
        <Button variant="outline" size="sm" onClick={copyClaimUrl}>
          <Copy className="mr-2 h-4 w-4" />
          Copy URL
        </Button>

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {showViewDetails && (
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/campaigns/${campaignId}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={generateQRCode}>
              <QrCode className="mr-2 h-4 w-4" />
              Generate QR Code
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Campaign
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Campaign
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code for {campaignName}</DialogTitle>
            <DialogDescription>
              Share this QR code for easy POAP claiming
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCodeUrl && (
              <div className="text-center">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="mx-auto border rounded-lg"
                />
              </div>
            )}
            <div className="text-center text-sm text-gray-600">
              <p className="mb-2">Scan to claim POAP:</p>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">
                {claimUrl}
              </code>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={copyClaimUrl} className="flex-1">
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </Button>
              <Button onClick={downloadQRCode} className="flex-1">
                Download QR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}