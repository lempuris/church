import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, ArrowLeft, Upload, X, CheckCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sermonService, memberService } from '@/services'
import type { SermonCreate, SermonUpdate, MediaType } from '@/types'

const sermonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  speaker_id: z.string().optional().or(z.literal('')),
  speaker_name: z.string().optional().or(z.literal('')),
  series_id: z.string().optional().or(z.literal('')),
  sermon_date: z.string().min(1, 'Sermon date is required'),
  scripture_reference: z.string().optional().or(z.literal('')),
})

type SermonFormData = z.infer<typeof sermonSchema>

interface UploadProgress {
  type: MediaType
  progress: number
  status: 'uploading' | 'complete' | 'error'
  error?: string
}

export function SermonForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const [uploads, setUploads] = useState<Record<MediaType, UploadProgress | null>>({
    audio: null,
    video: null,
    thumbnail: null,
    notes: null,
  })

  const { data: sermon, isLoading: sermonLoading } = useQuery({
    queryKey: ['sermon', id],
    queryFn: () => sermonService.getSermon(id!),
    enabled: isEditing,
  })

  const { data: seriesData } = useQuery({
    queryKey: ['sermon-series'],
    queryFn: () => sermonService.getSeries(false),
  })

  const { data: membersData } = useQuery({
    queryKey: ['members-for-speakers'],
    queryFn: () => memberService.getMembers({ page_size: 1000 }),
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SermonFormData>({
    resolver: zodResolver(sermonSchema),
    defaultValues: {
      sermon_date: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  const speakerId = watch('speaker_id')

  useEffect(() => {
    if (sermon) {
      reset({
        title: sermon.title,
        description: sermon.description || '',
        speaker_id: sermon.speaker_id || '',
        speaker_name: sermon.speaker_name || '',
        series_id: sermon.series_id || '',
        sermon_date: format(parseISO(sermon.sermon_date), 'yyyy-MM-dd'),
        scripture_reference: sermon.scripture_reference || '',
      })
    }
  }, [sermon, reset])

  const createMutation = useMutation({
    mutationFn: (data: SermonCreate) => sermonService.createSermon(data),
    onSuccess: (newSermon) => {
      queryClient.invalidateQueries({ queryKey: ['sermons'] })
      navigate(`/admin/sermons/${newSermon.id}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SermonUpdate }) =>
      sermonService.updateSermon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermons'] })
      queryClient.invalidateQueries({ queryKey: ['sermon', id] })
      navigate(`/admin/sermons/${id}`)
    },
  })

  const onSubmit = async (data: SermonFormData) => {
    const cleanData: SermonCreate = {
      title: data.title,
      sermon_date: new Date(data.sermon_date).toISOString(),
    }

    if (data.description) cleanData.description = data.description
    if (data.speaker_id) cleanData.speaker_id = data.speaker_id
    if (data.speaker_name && !data.speaker_id) cleanData.speaker_name = data.speaker_name
    if (data.series_id) cleanData.series_id = data.series_id
    if (data.scripture_reference) cleanData.scripture_reference = data.scripture_reference

    if (isEditing) {
      await updateMutation.mutateAsync({ id: id!, data: cleanData as SermonUpdate })
    } else {
      await createMutation.mutateAsync(cleanData)
    }
  }

  const handleFileUpload = async (file: File, mediaType: MediaType) => {
    if (!id) return

    setUploads((prev) => ({
      ...prev,
      [mediaType]: { type: mediaType, progress: 0, status: 'uploading' },
    }))

    try {
      await sermonService.uploadMedia(id, file, mediaType, (progress) => {
        setUploads((prev) => ({
          ...prev,
          [mediaType]: { type: mediaType, progress, status: 'uploading' },
        }))
      })

      setUploads((prev) => ({
        ...prev,
        [mediaType]: { type: mediaType, progress: 100, status: 'complete' },
      }))

      queryClient.invalidateQueries({ queryKey: ['sermon', id] })
    } catch {
      setUploads((prev) => ({
        ...prev,
        [mediaType]: {
          type: mediaType,
          progress: 0,
          status: 'error',
          error: 'Upload failed',
        },
      }))
    }
  }

  const handleFileDrop = (e: React.DragEvent, mediaType: MediaType) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file, mediaType)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, mediaType: MediaType) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file, mediaType)
  }

  if (isEditing && sermonLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={isEditing ? `/admin/sermons/${id}` : '/admin/sermons'}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Sermon' : 'Create Sermon'}</h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Update sermon details and upload media' : 'Add a new sermon recording'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Sermon Details</CardTitle>
              <CardDescription>Basic sermon information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" {...register('title')} placeholder="e.g., Walking by Faith" />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Sermon summary..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scripture_reference">Scripture Reference</Label>
                <Input
                  id="scripture_reference"
                  {...register('scripture_reference')}
                  placeholder="e.g., Hebrews 11:1-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sermon_date">Sermon Date *</Label>
                <Input id="sermon_date" type="date" {...register('sermon_date')} />
                {errors.sermon_date && (
                  <p className="text-sm text-destructive">{errors.sermon_date.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Speaker & Series */}
          <Card>
            <CardHeader>
              <CardTitle>Speaker & Series</CardTitle>
              <CardDescription>Categorize this sermon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="speaker_id">Speaker (from members)</Label>
                <select
                  id="speaker_id"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('speaker_id')}
                >
                  <option value="">Select a member...</option>
                  {membersData?.items.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {!speakerId && (
                <div className="space-y-2">
                  <Label htmlFor="speaker_name">Or enter speaker name</Label>
                  <Input
                    id="speaker_name"
                    {...register('speaker_name')}
                    placeholder="e.g., Pastor John Smith"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use this for guest speakers not in the member list
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="series_id">Sermon Series</Label>
                <select
                  id="series_id"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('series_id')}
                >
                  <option value="">No series</option>
                  {seriesData?.items.map((series) => (
                    <option key={series.id} value={series.id}>
                      {series.title}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Media Upload - Only show for existing sermons */}
          {isEditing && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Media Files</CardTitle>
                <CardDescription>Upload audio, video, thumbnail, and notes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Video Upload */}
                  <MediaUploadBox
                    label="Video"
                    accept="video/*"
                    mediaType="video"
                    currentUrl={sermon?.video_url}
                    upload={uploads.video}
                    onDrop={handleFileDrop}
                    onSelect={handleFileSelect}
                  />

                  {/* Audio Upload */}
                  <MediaUploadBox
                    label="Audio"
                    accept="audio/*"
                    mediaType="audio"
                    currentUrl={sermon?.audio_url}
                    upload={uploads.audio}
                    onDrop={handleFileDrop}
                    onSelect={handleFileSelect}
                  />

                  {/* Thumbnail Upload */}
                  <MediaUploadBox
                    label="Thumbnail"
                    accept="image/*"
                    mediaType="thumbnail"
                    currentUrl={sermon?.thumbnail_url}
                    upload={uploads.thumbnail}
                    onDrop={handleFileDrop}
                    onSelect={handleFileSelect}
                  />

                  {/* Notes Upload */}
                  <MediaUploadBox
                    label="Notes (PDF)"
                    accept=".pdf"
                    mediaType="notes"
                    currentUrl={sermon?.notes_url}
                    upload={uploads.notes}
                    onDrop={handleFileDrop}
                    onSelect={handleFileSelect}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Link to={isEditing ? `/admin/sermons/${id}` : '/admin/sermons'}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Sermon' : 'Create Sermon'}
          </Button>
        </div>
      </form>
    </div>
  )
}

interface MediaUploadBoxProps {
  label: string
  accept: string
  mediaType: MediaType
  currentUrl: string | null | undefined
  upload: UploadProgress | null
  onDrop: (e: React.DragEvent, type: MediaType) => void
  onSelect: (e: React.ChangeEvent<HTMLInputElement>, type: MediaType) => void
}

function MediaUploadBox({
  label,
  accept,
  mediaType,
  currentUrl,
  upload,
  onDrop,
  onSelect,
}: MediaUploadBoxProps) {
  const inputId = `file-${mediaType}`

  return (
    <div
      className="relative border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, mediaType)}
    >
      <input
        type="file"
        id={inputId}
        accept={accept}
        className="hidden"
        onChange={(e) => onSelect(e, mediaType)}
      />

      {upload?.status === 'uploading' ? (
        <div className="space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-medium">{upload.progress}%</p>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
        </div>
      ) : upload?.status === 'complete' || currentUrl ? (
        <div className="space-y-2">
          <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
          <p className="text-sm font-medium text-green-600">{label} uploaded</p>
          <label htmlFor={inputId}>
            <span className="text-xs text-primary cursor-pointer hover:underline">Replace</span>
          </label>
        </div>
      ) : upload?.status === 'error' ? (
        <div className="space-y-2">
          <X className="h-8 w-8 mx-auto text-destructive" />
          <p className="text-sm text-destructive">{upload.error}</p>
          <label htmlFor={inputId}>
            <span className="text-xs text-primary cursor-pointer hover:underline">Try again</span>
          </label>
        </div>
      ) : (
        <label htmlFor={inputId} className="cursor-pointer">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">Drop file or click to upload</p>
        </label>
      )}
    </div>
  )
}
