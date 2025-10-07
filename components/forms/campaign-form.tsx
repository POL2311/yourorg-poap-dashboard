// components/forms/campaign-form.tsx
'use client'

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toISO } from '@/lib/utils'
import { toast } from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  slug: z.string().min(1, 'Required').regex(/^[a-z0-9-]+$/, 'Use lowercase, numbers and dashes'),
  description: z.string().optional(),
  location: z.string().optional(),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('').transform(() => undefined)),
  externalUrl: z.string().url('Invalid URL').optional().or(z.literal('').transform(() => undefined)),
  secretCode: z.string().optional(),
  maxClaims: z.coerce.number().int().positive('Must be > 0').optional(),
  // Inputs vienen como "YYYY-MM-DDTHH:mm" (sin Z). Los validamos como string aquí
  eventDate: z.string().min(1, 'Required'),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
})

export type CampaignFormValues = z.infer<typeof schema>

type Props = {
  defaultValues?: Partial<CampaignFormValues>
  isLoading?: boolean
  onSubmit: (payload: any) => Promise<any> | any // el padre (CampaignsPage) hace la llamada al API
}

export function CampaignForm({ defaultValues, isLoading, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      location: '',
      imageUrl: '',
      externalUrl: '',
      secretCode: '',
      maxClaims: undefined,
      eventDate: '',   // ← <input type="datetime-local">
      startAt: '',
      endAt: '',
      ...defaultValues,
    },
  })

  const submit = async (values: CampaignFormValues) => {
    // Normalizamos fechas a ISO para el backend (z.string().datetime())
    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description || undefined,
      location: values.location || undefined,
      imageUrl: values.imageUrl || undefined,
      externalUrl: values.externalUrl || undefined,
      secretCode: values.secretCode || undefined,
      maxClaims: values.maxClaims ?? undefined,
      eventDate: toISO(values.eventDate), // ← CLAVE
      startAt: toISO(values.startAt),
      endAt: toISO(values.endAt),
      metadata: undefined, // si usas metadata aparte, puedes agregarlo aquí
    }

    if (!payload.eventDate) {
      toast.error('Invalid event date')
      return
    }

    try {
      await onSubmit(payload)
      reset()
      toast.success('Campaign created!')
    } catch (e: any) {
      // el padre ya muestra errores, esto es por si se llama directo
      toast.error(e?.message ?? 'Failed to create campaign')
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Campaign Name *</Label>
          <Input id="name" placeholder="My Awesome Event" {...register('name')} />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input id="slug" placeholder="my-awesome-event" {...register('slug')} />
          {errors.slug && <p className="text-sm text-red-600">{errors.slug.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" placeholder="Short description" {...register('description')} />
          {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="eventDate">Event Date *</Label>
          <Input
            id="eventDate"
            type="datetime-local"
            {...register('eventDate')}
          />
          {errors.eventDate && <p className="text-sm text-red-600">{errors.eventDate.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" placeholder="City / Venue" {...register('location')} />
          {errors.location && <p className="text-sm text-red-600">{errors.location.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input id="imageUrl" placeholder="https://example.com/image.png" {...register('imageUrl')} />
          {errors.imageUrl && <p className="text-sm text-red-600">{errors.imageUrl.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="externalUrl">External URL</Label>
          <Input id="externalUrl" placeholder="https://example.com" {...register('externalUrl')} />
          {errors.externalUrl && <p className="text-sm text-red-600">{errors.externalUrl.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="secretCode">Secret Code</Label>
          <Input id="secretCode" placeholder="Optional secret for claiming" {...register('secretCode')} />
          {errors.secretCode && <p className="text-sm text-red-600">{errors.secretCode.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxClaims">Max Claims</Label>
          <Input id="maxClaims" type="number" min={1} placeholder="e.g. 100" {...register('maxClaims')} />
          {errors.maxClaims && <p className="text-sm text-red-600">{errors.maxClaims.message}</p>}
        </div>

        {/* Opcional: ventanas para programar vigencia */}
        {/* 
        <div className="space-y-2">
          <Label htmlFor="startAt">Start At</Label>
          <Input id="startAt" type="datetime-local" {...register('startAt')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endAt">End At</Label>
          <Input id="endAt" type="datetime-local" {...register('endAt')} />
        </div>
        */}
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
