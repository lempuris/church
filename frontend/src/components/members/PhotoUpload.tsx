import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { memberService } from '@/services/members'

interface PhotoUploadProps {
  memberId: string
  currentPhotoUrl?: string | null
  onUploadComplete?: (photoUrl: string) => void
  onError?: (error: string) => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DIMENSION = 800 // Max width/height after resize
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function PhotoUpload({
  memberId,
  currentPhotoUrl,
  onUploadComplete,
  onError,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resizeImage = useCallback(
    (file: File): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        img.onload = () => {
          let { width, height } = img

          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_DIMENSION) {
              height = (height * MAX_DIMENSION) / width
              width = MAX_DIMENSION
            }
          } else {
            if (height > MAX_DIMENSION) {
              width = (width * MAX_DIMENSION) / height
              height = MAX_DIMENSION
            }
          }

          canvas.width = width
          canvas.height = height

          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }

          // Draw white background (for transparent images)
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, width, height)

          // Draw image
          ctx.drawImage(img, 0, 0, width, height)

          // Convert to JPEG blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Could not create image blob'))
              }
            },
            'image/jpeg',
            0.85
          )
        }

        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = URL.createObjectURL(file)
      })
    },
    []
  )

  const uploadPhoto = useCallback(
    async (file: File) => {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        onError?.('Please upload a JPEG, PNG, or WebP image')
        return
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        onError?.('File size must be less than 5MB')
        return
      }

      setIsUploading(true)

      try {
        // Resize image
        const resizedBlob = await resizeImage(file)

        // Get presigned URL
        const { upload_url, photo_url } = await memberService.getPhotoUploadUrl(memberId)

        // Upload to S3
        const uploadResponse = await fetch(upload_url, {
          method: 'PUT',
          body: resizedBlob,
          headers: {
            'Content-Type': 'image/jpeg',
          },
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image')
        }

        // Update preview
        setPreview(photo_url)
        onUploadComplete?.(photo_url)
      } catch (error) {
        console.error('Upload error:', error)
        onError?.(error instanceof Error ? error.message : 'Failed to upload photo')
      } finally {
        setIsUploading(false)
      }
    },
    [memberId, onUploadComplete, onError, resizeImage]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        uploadPhoto(file)
      }
    },
    [uploadPhoto]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const file = e.dataTransfer.files?.[0]
      if (file) {
        uploadPhoto(file)
      }
    },
    [uploadPhoto]
  )

  const removePhoto = useCallback(() => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Member photo"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
          />
          {!isUploading && (
            <div className="absolute -bottom-2 -right-2 flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full p-2 h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="rounded-full p-2 h-8 w-8"
                onClick={removePhoto}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 animate-spin text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-400">
                JPEG, PNG, or WebP (max 5MB)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PhotoUpload
