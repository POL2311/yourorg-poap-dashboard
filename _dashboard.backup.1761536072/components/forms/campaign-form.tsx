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

/** Helper: ISO -> valor compatible con <input type="datetime-local"> */
function toLocalInputValue(iso?: string) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    // YYYY-MM-DDTHH:mm (sin segundos ni Z)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
  } catch {
    return ''
  }
}

const schema = z.object({
  name: z.string().min(1, 'Required'),
  slug: z.string().min(1, 'Required').regex(/^[a-z0-9-]+$/, 'Use lowercase, numbers and dashes'),
  description: z.string().optional(),
  location: z.string().optional(),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('').transform(() => undefined)),
  externalUrl: z.string().url('Invalid URL').optional().or(z.literal('').transform(() => undefined)),
  secretCode: z.string().optional(),
  maxClaims: z.coerce.number().int().positive('Must be > 0').optional(),
  // el input manda "YYYY-MM-DDTHH:mm"
  eventDate: z.string().min(1, 'Required'),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
})

export type CampaignFormValues = z.infer<typeof schema>

type Props = {
  mode?: 'create' | 'edit'
  defaultValues?: Partial<CampaignFormValues>
  isLoading?: boolean
  submitLabel?: string
  onSubmit: (payload: any) => Promise<any> | any
}

export function CampaignForm({
  mode = 'create',
  defaultValues,
  isLoading,
  submitLabel,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
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
      eventDate: '', // datetime-local
      startAt: '',
      endAt: '',
      ...defaultValues,
      // Forzamos que el campo visible tenga el formato local correcto si viene ISO
      ...(defaultValues?.eventDate
        ? { eventDate: toLocalInputValue(defaultValues.eventDate) }
        : {}),
      ...(defaultValues?.startAt ? { startAt: toLocalInputValue(defaultValues.startAt) } : {}),
      ...(defaultValues?.endAt ? { endAt: toLocalInputValue(defaultValues.endAt) } : {}),
    },
  })

  // Si vienen nuevos defaultValues (por ejemplo al abrir un modal), sincroniza
  React.useEffect(() => {
    if (defaultValues) {
      reset({
        ...defaultValues,
        eventDate: toLocalInputValue(defaultValues.eventDate),
        startAt: toLocalInputValue(defaultValues.startAt),
        endAt: toLocalInputValue(defaultValues.endAt),
      })
    }
  }, [defaultValues, reset])

  const submit = async (values: CampaignFormValues) => {
    // Normalizamos fechas a ISO
    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description || undefined,
      location: values.location || undefined,
      imageUrl: values.imageUrl || undefined,
      externalUrl: values.externalUrl || undefined,
      secretCode: values.secretCode || undefined,
      maxClaims: values.maxClaims ?? undefined,
      eventDate: toISO(values.eventDate), // ← ISO
      startAt: toISO(values.startAt),
      endAt: toISO(values.endAt),
      metadata: undefined,
    }

    if (!payload.eventDate) {
      toast.error('Invalid event date')
      return
    }

try {
  await onSubmit(payload)
  if (mode === 'create') {
    reset()
  }
} catch (e: any) {
  toast.error(e?.message ?? 'Failed to submit campaign')
}
  }

  const eventDateVal = watch('eventDate')

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
          <Input
            id="slug"
            placeholder="my-awesome-event"
            {...register('slug')}
            // si no quieres editar el slug en modo edición, descomenta:
            // disabled={mode === 'edit'}
          />
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
            value={eventDateVal || ''}
            onChange={(e) => setValue('eventDate', e.target.value, { shouldValidate: true })}
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
          <Label htmlFor="maxClaims">Max Claims</Label>
          <Input id="maxClaims" type="number" min={1} placeholder="e.g. 100" {...register('maxClaims')} />
          {errors.maxClaims && <p className="text-sm text-red-600">{errors.maxClaims.message}</p>}
        </div>

        {/* Si vas a habilitar ventanas de vigencia, descomenta estos campos
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
              {isLoading ? (mode === 'create' ? 'Creating...' : 'Saving...') : (submitLabel ?? (mode === 'create' ? 'Create Campaign' : 'Save Changes'))}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
