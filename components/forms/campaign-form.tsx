'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const campaignSchema = z.object({
  name: z.string().min(2, 'Campaign name must be at least 2 characters'),
  description: z.string().optional(),
  eventDate: z.string().min(1, 'Event date is required'),
  location: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  externalUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  secretCode: z.string().optional(),
  maxClaims: z.number().int().positive().optional(),
})

type CampaignFormData = z.infer<typeof campaignSchema>

interface CampaignFormProps {
  onSubmit: (data: CampaignFormData) => Promise<void>
  isLoading: boolean
  initialData?: Partial<CampaignFormData>
}

export function CampaignForm({ onSubmit, isLoading, initialData }: CampaignFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      eventDate: initialData?.eventDate || '',
      location: initialData?.location || '',
      imageUrl: initialData?.imageUrl || '',
      externalUrl: initialData?.externalUrl || '',
      secretCode: initialData?.secretCode || '',
      maxClaims: initialData?.maxClaims || undefined,
    },
  })

  const handleFormSubmit = async (data: CampaignFormData) => {
    // Convert empty strings to undefined
    const cleanData = {
      ...data,
      description: data.description || undefined,
      location: data.location || undefined,
      imageUrl: data.imageUrl || undefined,
      externalUrl: data.externalUrl || undefined,
      secretCode: data.secretCode || undefined,
      maxClaims: data.maxClaims || undefined,
    }
    
    await onSubmit(cleanData)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Campaign Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="e.g., Solana Breakpoint 2024"
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          {...register('description')}
          placeholder="Brief description of your event"
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Event Date and Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="eventDate">Event Date *</Label>
          <Input
            id="eventDate"
            type="datetime-local"
            {...register('eventDate')}
            disabled={isLoading}
          />
          {errors.eventDate && (
            <p className="text-sm text-red-600">{errors.eventDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            {...register('location')}
            placeholder="e.g., Singapore, Virtual"
            disabled={isLoading}
          />
          {errors.location && (
            <p className="text-sm text-red-600">{errors.location.message}</p>
          )}
        </div>
      </div>

      {/* Image URL and External URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            {...register('imageUrl')}
            placeholder="https://example.com/image.png"
            disabled={isLoading}
          />
          {errors.imageUrl && (
            <p className="text-sm text-red-600">{errors.imageUrl.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="externalUrl">External URL</Label>
          <Input
            id="externalUrl"
            {...register('externalUrl')}
            placeholder="https://your-event-website.com"
            disabled={isLoading}
          />
          {errors.externalUrl && (
            <p className="text-sm text-red-600">{errors.externalUrl.message}</p>
          )}
        </div>
      </div>

      {/* Secret Code and Max Claims */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="secretCode">Secret Code</Label>
          <Input
            id="secretCode"
            {...register('secretCode')}
            placeholder="e.g., BREAKPOINT2024"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500">
            Optional code users need to enter to claim POAP
          </p>
          {errors.secretCode && (
            <p className="text-sm text-red-600">{errors.secretCode.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxClaims">Max Claims</Label>
          <Input
            id="maxClaims"
            type="number"
            {...register('maxClaims', { valueAsNumber: true })}
            placeholder="e.g., 1000"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500">
            Maximum number of POAPs that can be claimed
          </p>
          {errors.maxClaims && (
            <p className="text-sm text-red-600">{errors.maxClaims.message}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Campaign'
          )}
        </Button>
      </div>
    </form>
  )
}